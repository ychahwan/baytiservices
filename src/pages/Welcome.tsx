import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Users, Briefcase, User2, Store } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UserCounts {
  operators: number;
  field_operators: number;
  service_providers: number;
  stores: number;
}

export function Welcome() {
  const [email, setEmail] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState<UserCounts>({
    operators: 0,
    field_operators: 0,
    service_providers: 0,
    stores: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email);
        }

        // Fetch user counts
        const [operators, fieldOperators, serviceProviders, stores] = await Promise.all([
          supabase.from('operators').select('id', { count: 'exact' }),
          supabase.from('field_operators').select('id', { count: 'exact' }),
          supabase.from('service_providers').select('id', { count: 'exact' }),
          supabase.from('stores').select('id', { count: 'exact' })
        ]);

        setUserCounts({
          operators: operators.count || 0,
          field_operators: fieldOperators.count || 0,
          service_providers: serviceProviders.count || 0,
          stores: stores.count || 0,
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const userCountsData = {
    labels: ['Operators', 'Field Operators', 'Service Providers', 'Stores'],
    datasets: [
      {
        label: 'Number of Users',
        data: [
          userCounts.operators,
          userCounts.field_operators,
          userCounts.service_providers,
          userCounts.stores
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="mt-2 text-lg text-gray-600">
              You are logged in as {email}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Operators</h3>
                  <p className="text-3xl font-bold text-blue-600">{userCounts.operators}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center">
                <User2 className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Field Operators</h3>
                  <p className="text-3xl font-bold text-yellow-600">{userCounts.field_operators}</p>
                </div>
              </div>
            </div>
            <div className="bg-teal-50 rounded-lg p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-teal-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Service Providers</h3>
                  <p className="text-3xl font-bold text-teal-600">{userCounts.service_providers}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center">
                <Store className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Stores</h3>
                  <p className="text-3xl font-bold text-purple-600">{userCounts.stores}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <Bar options={barOptions} data={userCountsData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}