import React, { useState, useEffect } from 'react';
import { defidb, MetricTypes } from '../../services/defidb';
import DeFiMetricCard from './DeFiMetricCard';
import DeFiChart from './DeFiChart';
import { useToast } from '../../context/ToastContext';
import './DeFiDashboard.css';

/**
 * DeFi Analytics Dashboard Component
 * 
 * INTERNAL: Main visualization interface for platform financial metrics
 * STATE MANAGEMENT: Uses a combination of local state and defidb singleton
 * UX PATTERN: Implements optimistic UI updates with background data refresh
 * PERFORMANCE: Card components use memoization to minimize renders
 */
const DeFiDashboard = () => {
  // Local state for UI rendering and user interactions
  const [metrics, setMetrics] = useState(defidb.getAllMetrics());
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState(MetricTypes.TVL);
  const toast = useToast();

  useEffect(() => {
    /**
     * INTERNAL: Subscribe to metrics updates and manage initial data load
     * DATA FLOW: Component → defidb → blockchain → component (via subscription)
     * CLEANUP: Unsubscribes on unmount to prevent memory leaks
     */
    const subscriptionId = defidb.subscribe((updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    // Initial load if data is stale
    if (defidb.isDataStale()) {
      refreshData();
    }

    return () => {
      defidb.unsubscribe(subscriptionId);
    };
  }, []);

  /**
   * Refreshes DeFi metrics data from the blockchain
   * 
   * INTERNAL: Main data refresh function triggered by user or auto-refresh
   * ERROR HANDLING: Gracefully handles connection issues with toast notifications
   * UX FEEDBACK: Shows loading states and success/error notifications
   */
  const refreshData = async () => {
    setLoading(true);
    try {
      // Try to connect provider if not initialized
      if (!defidb.isInitialized) {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await defidb.initialize(provider);
        }
      }

      // Refresh metrics data
      const success = await defidb.refreshMetrics();
      
      if (success) {
        toast.showSuccess("DeFi metrics updated successfully");
      } else {
        toast.showWarning("Using cached DeFi data", { duration: 3000 });
      }
    } catch (error) {
      console.error('Error refreshing DeFi data:', error);
      toast.showRed2("Failed to update DeFi metrics", {
        position: 'top-center',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="defi-dashboard">
      {/* INTERNAL: Header section with title and refresh control */}
      <div className="defi-dashboard-header">
        <h2>DeFi Analytics Dashboard</h2>
        <button
          className={`refresh-button ${loading ? 'loading' : ''}`}
          onClick={refreshData}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i> {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* INTERNAL: 
          Metrics grid renders all financial indicators
          PATTERN: Uses consistent card components for visual coherence
          INTERACTION: Each card is clickable to select chart data
      */}
      <div className="defi-metrics-grid">
        <DeFiMetricCard
          title="Total Value Locked"
          value={defidb.getFormattedMetric(MetricTypes.TVL)}
          change={metrics[MetricTypes.TVL].change24h}
          icon="fa-lock"
          onClick={() => setSelectedChart(MetricTypes.TVL)}
          selected={selectedChart === MetricTypes.TVL}
        />
        <DeFiMetricCard
          title="Trading Volume (24h)"
          value={defidb.getFormattedMetric(MetricTypes.TRADING_VOLUME)}
          change={metrics[MetricTypes.TRADING_VOLUME].change24h}
          icon="fa-chart-line"
          onClick={() => setSelectedChart(MetricTypes.TRADING_VOLUME)}
          selected={selectedChart === MetricTypes.TRADING_VOLUME}
        />
        <DeFiMetricCard
          title="Creator Earnings"
          value={defidb.getFormattedMetric(MetricTypes.CREATOR_EARNINGS)}
          change={metrics[MetricTypes.CREATOR_EARNINGS].change24h}
          icon="fa-hand-holding-usd"
          onClick={() => setSelectedChart(MetricTypes.CREATOR_EARNINGS)}
          selected={selectedChart === MetricTypes.CREATOR_EARNINGS}
        />
        <DeFiMetricCard
          title="STREAM Holders"
          value={metrics[MetricTypes.TOKEN_HOLDERS].value}
          change={metrics[MetricTypes.TOKEN_HOLDERS].change24h}
          icon="fa-users"
          onClick={() => setSelectedChart(MetricTypes.TOKEN_HOLDERS)}
          selected={selectedChart === MetricTypes.TOKEN_HOLDERS}
        />
        <DeFiMetricCard
          title="Staking APY"
          value={`${metrics[MetricTypes.APY].value}%`}
          change={metrics[MetricTypes.APY].change24h}
          icon="fa-percentage"
          onClick={() => setSelectedChart(MetricTypes.APY)}
          selected={selectedChart === MetricTypes.APY}
        />
        <DeFiMetricCard
          title="Liquidity Pools"
          value={defidb.getFormattedMetric(MetricTypes.LIQUIDITY)}
          change={metrics[MetricTypes.LIQUIDITY].change24h}
          icon="fa-water"
          onClick={() => setSelectedChart(MetricTypes.LIQUIDITY)}
          selected={selectedChart === MetricTypes.LIQUIDITY}
        />
        <DeFiMetricCard
          title="Total Staked"
          value={`${defidb.getFormattedMetric(MetricTypes.STAKING, false)} STREAM`}
          change={metrics[MetricTypes.STAKING].change24h}
          icon="fa-layer-group"
          onClick={() => setSelectedChart(MetricTypes.STAKING)}
          selected={selectedChart === MetricTypes.STAKING}
        />
        <DeFiMetricCard
          title="Circulating Supply"
          value={`${defidb.getFormattedMetric(MetricTypes.SUPPLY, false)}/${defidb._formatNumber(metrics[MetricTypes.SUPPLY].total)} STREAM`}
          change={metrics[MetricTypes.SUPPLY].change24h}
          icon="fa-coins"
          onClick={() => setSelectedChart(MetricTypes.SUPPLY)}
          selected={selectedChart === MetricTypes.SUPPLY}
        />
      </div>

      {/* INTERNAL: 
          Chart visualization for selected metric
          DATA FLOW: selectedChart state → chart component → visualization
          RESPONSIVE: Adjusts to container width
      */}
      <div className="defi-chart-section">
        <h3>{getChartTitle(selectedChart)}</h3>
        <DeFiChart metricType={selectedChart} data={metrics[selectedChart]} />
      </div>

      {/* INTERNAL: 
          Action buttons for core DeFi functions
          ROUTING: Links to dedicated functional pages
          UX PATTERN: Primary actions most prominent
      */}
      <div className="defi-actions">
        <a href="/defi/stake" className="button primary">
          <i className="fas fa-layer-group"></i> Stake Tokens
        </a>
        <a href="/defi/liquidity" className="button secondary">
          <i className="fas fa-water"></i> Provide Liquidity
        </a>
        <a href="/defi/swap" className="button outline">
          <i className="fas fa-exchange-alt"></i> Swap Tokens
        </a>
      </div>
    </div>
  );
};

/**
 * Returns an appropriate title for the selected chart type
 * 
 * INTERNAL: Used for chart header display
 * EXTENSIBILITY: Update when adding new metric types
 */
function getChartTitle(metricType) {
  const titles = {
    [MetricTypes.TVL]: 'Total Value Locked - Historical Data',
    [MetricTypes.TRADING_VOLUME]: 'Trading Volume - 30 Day Trend',
    [MetricTypes.CREATOR_EARNINGS]: 'Creator Earnings - Growth Trend',
    [MetricTypes.TOKEN_HOLDERS]: 'STREAM Token Holders - Growth Rate',
    [MetricTypes.APY]: 'Staking APY - Historical Rates',
    [MetricTypes.LIQUIDITY]: 'Liquidity Pools - Total Value',
    [MetricTypes.STAKING]: 'Staked STREAM Tokens - Historical Data',
    [MetricTypes.SUPPLY]: 'STREAM Token Supply Distribution'
  };
  
  return titles[metricType] || 'Historical Data';
}

export default DeFiDashboard;
