import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Award,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { Client, PLAN_NAMES, MonthlyData, YearlyData, User } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { StatCard } from '../UI/StatCard';
import { useUserPreferences } from '../../hooks/useUserPreferences';

interface ReportsProps {
  clients: Client[];
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ clients, user }) => {
  const { 
    preferences, 
    setReportViewType, 
    setSelectedYear 
  } = useUserPreferences(user.id);
  
  // Get values from preferences or defaults
  const selectedYear = preferences?.selectedYear || new Date().getFullYear();
  const viewType = preferences?.reportViewType || 'monthly';

  const purchasedClients = clients.filter(client => client.status === 'purchased');

  // Process data by months and years
  const { monthlyData, yearlyData } = useMemo(() => {
    const monthlyMap = new Map<string, MonthlyData>();
    const yearlyMap = new Map<number, YearlyData>();

    const monthNames = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    purchasedClients.forEach(client => {
      const date = new Date(client.purchaseDate);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${month}`;

      // Monthly data
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthNames[month],
          year,
          totalSales: 0,
          clientCount: 0,
          clients: []
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.totalSales += client.price;
      monthData.clientCount += 1;
      monthData.clients.push(client);

      // Yearly data
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, {
          year,
          totalSales: 0,
          clientCount: 0,
          months: []
        });
      }

      const yearData = yearlyMap.get(year)!;
      yearData.totalSales += client.price;
      yearData.clientCount += 1;
    });

    // Convert to arrays and sort
    const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return new Date(a.year, monthNames.indexOf(a.month)).getTime() - 
             new Date(b.year, monthNames.indexOf(b.month)).getTime();
    });

    const yearlyArray = Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);

    return {
      monthlyData: monthlyArray,
      yearlyData: yearlyArray
    };
  }, [purchasedClients]);

  const currentYearData = yearlyData.find(y => y.year === selectedYear);
  const currentYearMonthly = monthlyData.filter(m => m.year === selectedYear);

  const availableYears = yearlyData.map(y => y.year);

  // Calculate summary stats
  const totalAllTime = purchasedClients.reduce((sum, client) => sum + client.price, 0);
  const totalClientsAllTime = purchasedClients.length;
  const currentYearTotal = currentYearData?.totalSales || 0;
  const currentYearClients = currentYearData?.clientCount || 0;

  const exportToExcel = () => {
    const data = viewType === 'monthly' ? currentYearMonthly : yearlyData;
    
    // Debug: Log the data to understand what's being exported
    console.log('Export data:', data);
    console.log('View type:', viewType);
    console.log('Selected year:', selectedYear);
    console.log('Purchased clients:', purchasedClients);
    
    // If no data, create a row indicating no data
    if (data.length === 0) {
      const csvContent = [
        // Headers
        viewType === 'monthly' 
          ? ['חודש', 'שנה', 'סה"כ מכירות', 'מספר לקוחות']
          : ['שנה', 'סה"כ מכירות', 'מספר לקוחות'],
        // No data row
        viewType === 'monthly' 
          ? ['אין נתונים', selectedYear, 0, 0]
          : ['אין נתונים', 0, 0]
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `דוח_מכירות_${viewType === 'monthly' ? selectedYear : 'שנתי'}.csv`;
      link.click();
      return;
    }

    const csvContent = [
      // Headers
      viewType === 'monthly' 
        ? ['חודש', 'שנה', 'סה"כ מכירות', 'מספר לקוחות']
        : ['שנה', 'סה"כ מכירות', 'מספר לקוחות'],
      // Data rows
      ...data.map(item => 
        viewType === 'monthly' 
          ? [(item as MonthlyData).month, item.year, item.totalSales, item.clientCount]
          : [item.year, item.totalSales, item.clientCount]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_מכירות_${viewType === 'monthly' ? selectedYear : 'שנתי'}.csv`;
    link.click();
  };

  const exportClientsToExcel = () => {
    const purchasedClients = clients.filter(client => client.status === 'purchased');
    const totalSalesAmount = purchasedClients.reduce((sum, client) => sum + client.price, 0);
    
    const csvContent = [
      // Headers - RTL order for Hebrew language support
      ['תאריך', 'שם', 'טלפון', 'תוכנית', 'סכום', 'הערות', 'סה״כ מכירות'],
      // Data rows
      ...purchasedClients.map(client => [
        new Date(client.purchaseDate).toLocaleDateString('he-IL'),
        client.name,
        client.phone,
        PLAN_NAMES[client.plan],
        client.price,
        client.notes || '',
        totalSalesAmount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `רשימת_לקוחות_${new Date().toLocaleDateString('he-IL').replace(/\//g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <BarChart3 className="w-6 h-6 ml-2" />
              דוחות מכירות
            </h1>
            <p className="text-blue-100">
              מעקב מפורט אחר המכירות וההיסטוריה שלך
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-blue-200">סה"כ מכירות</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAllTime)}</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={viewType} 
                onChange={(e) => setReportViewType(e.target.value as 'monthly' | 'yearly')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="monthly">תצוגה חודשית</option>
                <option value="yearly">תצוגה שנתית</option>
              </select>
            </div>
            
            {viewType === 'monthly' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-success-600 text-white px-4 py-2 rounded-lg hover:bg-success-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              ייצא דוח סיכום
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportClientsToExcel}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              ייצא רשימת לקוחות
            </motion.button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title={'סה"כ מכירות'}
            value={formatCurrency(totalAllTime)}
            icon={TrendingUp}
            color="primary"
          />
          <StatCard
            title={'סה"כ לקוחות'}
            value={totalClientsAllTime}
            icon={Users}
            color="success"
          />
          <StatCard
            title={`מכירות ${selectedYear}`}
            value={formatCurrency(currentYearTotal)}
            icon={Award}
            color="warning"
          />
          <StatCard
            title={`לקוחות ${selectedYear}`}
            value={currentYearClients}
            icon={Users}
            color="primary"
          />
        </div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {viewType === 'monthly' ? `נתונים חודשיים - ${selectedYear}` : 'נתונים שנתיים'}
          </h2>
          <FileSpreadsheet className="w-5 h-5 text-gray-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  {viewType === 'monthly' ? 'חודש' : 'שנה'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  מספר לקוחות
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  סה"כ מכירות
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  ממוצע ללקוח
                </th>
              </tr>
            </thead>
            <tbody>
              {(viewType === 'monthly' ? currentYearMonthly : yearlyData).map((item, index) => (
                <motion.tr
                  key={viewType === 'monthly' ? `${item.year}-${(item as MonthlyData).month}` : item.year}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {viewType === 'monthly' ? `${(item as MonthlyData).month} ${item.year}` : item.year}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.clientCount}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalSales)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCurrency(item.clientCount > 0 ? item.totalSales / item.clientCount : 0)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {(viewType === 'monthly' ? currentYearMonthly : yearlyData).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            אין נתונים להצגה
          </div>
        )}
      </motion.div>

      {/* Detailed Client List for Selected Period */}
      {viewType === 'monthly' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            פירוט לקוחות - {selectedYear}
          </h3>
          
          <div className="space-y-4">
            {currentYearMonthly.map((monthData) => (
              <div key={`${monthData.year}-${monthData.month}`} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {monthData.month} {monthData.year}
                  </h4>
                  <div className="text-sm text-gray-600">
                    {monthData.clientCount} לקוחות • {formatCurrency(monthData.totalSales)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {monthData.clients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-gray-500">
                            {PLAN_NAMES[client.plan]} • {new Date(client.purchaseDate).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-primary-600">
                        {formatCurrency(client.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}; 