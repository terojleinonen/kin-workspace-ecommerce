import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CMSSyncDashboard } from '../app/components/cms/CMSSyncDashboard'
import { CMSConnectionStatus } from '../app/components/cms/CMSConnectionStatus'
import { CMSSyncHistory } from '../app/components/cms/CMSSyncHistory'

// Mock the CMS services
jest.mock('../app/lib/cms-client')
jest.mock('../app/lib/cms-fallback')
jest.mock('../app/lib/product-sync')

const mockSyncStatus = {
  isHealthy: true,
  lastSuccessfulSync: new Date('2023-01-01T12:00:00Z'),
  lastAttemptedSync: new Date('2023-01-01T12:00:00Z'),
  errorCount: 0,
  lastError: null,
  daysSinceLastSync: 0.5,
  circuitBreakerOpen: false
}

const mockSyncHistory = [
  {
    success: true,
    productsUpdated: 5,
    productsAdded: 2,
    productsRemoved: 0,
    errors: [],
    lastSync: new Date('2023-01-01T12:00:00Z'),
    duration: 2500
  },
  {
    success: false,
    productsUpdated: 0,
    productsAdded: 0,
    productsRemoved: 0,
    errors: ['Connection timeout'],
    lastSync: new Date('2023-01-01T11:00:00Z'),
    duration: 5000
  }
]

describe('CMS Management UI Components', () => {
  describe('CMSSyncDashboard', () => {
    it('should render sync dashboard with status information', async () => {
      render(<CMSSyncDashboard initialStatus={mockSyncStatus} />)

      expect(screen.getByText('CMS Sync Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Connection Status')).toBeInTheDocument()
      expect(screen.getByText('Manual Sync')).toBeInTheDocument()
      expect(screen.getByText('Sync History')).toBeInTheDocument()
    })

    it('should display sync status correctly', async () => {
      render(<CMSSyncDashboard initialStatus={mockSyncStatus} />)

      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByText(/\d+ days ago/)).toBeInTheDocument()
      expect(screen.getByText('0 errors')).toBeInTheDocument()
    })

    it('should handle manual sync trigger', async () => {
      const mockTriggerSync = jest.fn().mockResolvedValue({
        success: true,
        productsUpdated: 3,
        productsAdded: 1,
        productsRemoved: 0,
        errors: [],
        lastSync: new Date(),
        duration: 1500
      })

      render(<CMSSyncDashboard onTriggerSync={mockTriggerSync} />)

      const syncButton = screen.getByText('Start Sync')
      fireEvent.click(syncButton)

      expect(mockTriggerSync).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument()
      })
    })

    it('should show error state when sync fails', async () => {
      const mockTriggerSync = jest.fn().mockResolvedValue({
        success: false,
        productsUpdated: 0,
        productsAdded: 0,
        productsRemoved: 0,
        errors: ['Network error'],
        lastSync: new Date(),
        duration: 1000
      })

      render(<CMSSyncDashboard onTriggerSync={mockTriggerSync} />)

      const syncButton = screen.getByText('Start Sync')
      fireEvent.click(syncButton)

      await waitFor(() => {
        expect(screen.getByText('Sync failed')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('CMSConnectionStatus', () => {
    it('should display healthy connection status', () => {
      render(<CMSConnectionStatus status={mockSyncStatus} />)

      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByTestId('status-indicator-healthy')).toBeInTheDocument()
    })

    it('should display unhealthy connection status', () => {
      const unhealthyStatus = {
        ...mockSyncStatus,
        isHealthy: false,
        errorCount: 3,
        lastError: 'Connection timeout',
        daysSinceLastSync: 2
      }

      render(<CMSConnectionStatus status={unhealthyStatus} />)

      expect(screen.getByText('Disconnected')).toBeInTheDocument()
      expect(screen.getByText('Unhealthy')).toBeInTheDocument()
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
      expect(screen.getByText('3 errors')).toBeInTheDocument()
      expect(screen.getByTestId('status-indicator-unhealthy')).toBeInTheDocument()
    })

    it('should display circuit breaker status', () => {
      const circuitBreakerStatus = {
        ...mockSyncStatus,
        circuitBreakerOpen: true,
        isHealthy: false
      }

      render(<CMSConnectionStatus status={circuitBreakerStatus} />)

      expect(screen.getByText('Circuit Breaker Open')).toBeInTheDocument()
      expect(screen.getByTestId('circuit-breaker-indicator')).toBeInTheDocument()
    })

    it('should handle connection test', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue({
        success: true,
        status: 'connected',
        responseTime: 150
      })

      render(
        <CMSConnectionStatus 
          status={mockSyncStatus} 
          onTestConnection={mockTestConnection}
        />
      )

      const testButton = screen.getByText('Test Connection')
      fireEvent.click(testButton)

      expect(mockTestConnection).toHaveBeenCalled()

      await waitFor(() => {
        expect(screen.getByText('Testing...')).toBeInTheDocument()
      })
    })
  })

  describe('CMSSyncHistory', () => {
    it('should display sync history entries', () => {
      render(<CMSSyncHistory history={mockSyncHistory} />)

      expect(screen.getByText('Sync History')).toBeInTheDocument()
      expect(screen.getAllByText('Success')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Failed')[0]).toBeInTheDocument()
      expect(screen.getByText('5 updated, 2 added')).toBeInTheDocument()
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('should show empty state when no history', () => {
      render(<CMSSyncHistory history={[]} />)

      expect(screen.getByText('No sync history available')).toBeInTheDocument()
    })

    it('should format sync duration correctly', () => {
      render(<CMSSyncHistory history={mockSyncHistory} />)

      expect(screen.getByText('2.5s')).toBeInTheDocument()
      expect(screen.getByText('5.0s')).toBeInTheDocument()
    })

    it('should handle pagination for large history', () => {
      const largeHistory = Array.from({ length: 25 }, (_, i) => ({
        success: i % 2 === 0,
        productsUpdated: i,
        productsAdded: 0,
        productsRemoved: 0,
        errors: i % 2 === 1 ? ['Error'] : [],
        lastSync: new Date(Date.now() - i * 3600000),
        duration: 1000 + i * 100
      }))

      render(<CMSSyncHistory history={largeHistory} />)

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should filter history by status', () => {
      render(<CMSSyncHistory history={mockSyncHistory} />)

      const filterSelect = screen.getByDisplayValue('All')
      fireEvent.change(filterSelect, { target: { value: 'success' } })

      expect(screen.getAllByText('Success')[0]).toBeInTheDocument()
      // Check that the failed entry is not visible (only the option in select remains)
      expect(screen.getAllByText('Failed')).toHaveLength(1) // Only the option
    })
  })

  describe('Integration', () => {
    it('should update dashboard when sync completes', async () => {
      const mockTriggerSync = jest.fn().mockResolvedValue({
        success: true,
        productsUpdated: 10,
        productsAdded: 5,
        productsRemoved: 1,
        errors: [],
        lastSync: new Date(),
        duration: 3000
      })

      render(<CMSSyncDashboard onTriggerSync={mockTriggerSync} />)

      const syncButton = screen.getByText('Start Sync')
      fireEvent.click(syncButton)

      await waitFor(() => {
        expect(screen.getByText('Sync completed successfully')).toBeInTheDocument()
        expect(screen.getByText('10 updated, 5 added, 1 removed')).toBeInTheDocument()
      })
    })

    it('should refresh status after manual sync', async () => {
      const mockRefreshStatus = jest.fn().mockResolvedValue({
        ...mockSyncStatus,
        lastSuccessfulSync: new Date()
      })

      render(
        <CMSSyncDashboard 
          onTriggerSync={jest.fn()}
          onRefreshStatus={mockRefreshStatus}
        />
      )

      const refreshButton = screen.getByText('Refresh Status')
      fireEvent.click(refreshButton)

      expect(mockRefreshStatus).toHaveBeenCalled()
    })
  })
})