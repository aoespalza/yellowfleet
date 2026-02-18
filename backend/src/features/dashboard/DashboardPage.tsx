import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const kpiData = [
  { title: 'Total Machines', value: '24', change: '+2', trend: 'up' },
  { title: 'Active Contracts', value: '12', change: '+3', trend: 'up' },
  { title: 'Revenue MTD', value: '$145,000', change: '+15%', trend: 'up' },
  { title: 'Fleet Availability', value: '87%', change: '-2%', trend: 'down' },
];

const revenueData = [
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 78000 },
  { month: 'Apr', revenue: 110000 },
  { month: 'May', revenue: 125000 },
  { month: 'Jun', revenue: 145000 },
];

const machineStatusData = [
  { name: 'Available', value: 12, color: '#22c55e' },
  { name: 'In Contract', value: 8, color: '#3b82f6' },
  { name: 'In Workshop', value: 3, color: '#f59e0b' },
  { name: 'Inactive', value: 1, color: '#ef4444' },
];

const maintenanceData = [
  { month: 'Jan', preventive: 5, corrective: 2 },
  { month: 'Feb', preventive: 7, corrective: 1 },
  { month: 'Mar', preventive: 4, corrective: 3 },
  { month: 'Apr', preventive: 6, corrective: 2 },
  { month: 'May', preventive: 8, corrective: 1 },
  { month: 'Jun', preventive: 5, corrective: 4 },
];

export default function DashboardPage() {
  const totalRevenue = useMemo(() => {
    return revenueData.reduce((sum, item) => sum + item.revenue, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <p className="text-sm font-medium text-gray-500 mb-2">{kpi.title}</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-gray-900">{kpi.value}</span>
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Machine Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={machineStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {machineStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={maintenanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="preventive" fill="#22c55e" name="Preventive" radius={[4, 4, 0, 0]} />
              <Bar dataKey="corrective" fill="#ef4444" name="Corrective" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
