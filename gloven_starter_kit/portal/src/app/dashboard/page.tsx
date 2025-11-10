/**
 * Dashboard Page
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Role-aware dashboard that shows different content based on user role.
 * Accessible to all authenticated users.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getAccessibleResources } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { signOut } from '@/app/actions/auth';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect('/signin');
  }

  const user = session.user;
  const resources = await getAccessibleResources({
    role: user.role!,
    id: user.id,
  });

  // Get role-specific statistics
  const stats = await getRoleSpecificStats(user.role!, user.id);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hello, {user.role?.toLowerCase()}.
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome to your Gloven dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {user.role}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      <div className="px-4 py-6 sm:px-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Statistics Cards */}
          {stats.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stat.value}
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Role-specific sections */}
        <div className="mt-8">
          {user.role === 'ADMIN' && <AdminDashboard resources={resources} />}
          {user.role === 'STAFF' && <StaffDashboard resources={resources} />}
          {user.role === 'FOUNDER' && <FounderDashboard resources={resources} />}
          {user.role === 'INVESTOR' && <InvestorDashboard resources={resources} />}
          {user.role === 'MENTOR' && <MentorDashboard resources={resources} />}
        </div>
      </div>
    </div>
  );
}

// Role-specific dashboard components
function AdminDashboard({ resources }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Admin Overview</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Users</h4>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {resources.users?.length || 0}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Cohorts</h4>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {resources.cohorts?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard({ resources }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Staff Dashboard</h3>
        <p className="mt-2 text-sm text-gray-600">
          Manage applications, cohorts, and program operations.
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500">Pending Applications</h4>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {resources.applications?.filter((app: any) => app.status === 'PENDING').length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function FounderDashboard({ resources }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Founder Dashboard</h3>
        <p className="mt-2 text-sm text-gray-600">
          Manage your startup and track your applications.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">My Startups</h4>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {resources.startups?.length || 0}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Applications</h4>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {resources.applications?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvestorDashboard({ resources }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Investor Dashboard</h3>
        <p className="mt-2 text-sm text-gray-600">
          Discover promising startups and track your interests.
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500">Active Startups</h4>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {resources.startups?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function MentorDashboard({ resources }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Mentor Dashboard</h3>
        <p className="mt-2 text-sm text-gray-600">
          Support startups and help them grow.
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500">Active Cohort Startups</h4>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {resources.startups?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get role-specific statistics
async function getRoleSpecificStats(role: string, userId?: string) {
  const stats = [];

  switch (role) {
    case 'ADMIN':
      const [users, cohorts, startups] = await Promise.all([
        prisma.user.count(),
        prisma.cohort.count(),
        prisma.startup.count(),
      ]);
      stats.push(
        { label: 'Total Users', value: users },
        { label: 'Cohorts', value: cohorts },
        { label: 'Startups', value: startups }
      );
      break;

    case 'STAFF':
      const pendingApps = await prisma.application.count({
        where: { status: 'PENDING' },
      });
      const activeCohorts = await prisma.cohort.count({
        where: { status: 'ACTIVE' },
      });
      stats.push(
        { label: 'Pending Applications', value: pendingApps },
        { label: 'Active Cohorts', value: activeCohorts },
        { label: 'Startups', value: await prisma.startup.count() }
      );
      break;

    case 'FOUNDER':
      if (userId) {
        const myStartups = await prisma.startup.count({
          where: { founders: { some: { id: userId } } },
        });
        const myApplications = await prisma.application.count({
          where: { startup: { founders: { some: { id: userId } } } },
        });
        stats.push(
          { label: 'My Startups', value: myStartups },
          { label: 'Applications', value: myApplications },
          { label: 'Active Cohorts', value: await prisma.cohort.count({
            where: { status: { in: ['UPCOMING', 'ACTIVE'] } },
          }) }
        );
      }
      break;

    case 'INVESTOR':
      const activeStartups = await prisma.startup.count({
        where: { cohort: { status: 'ACTIVE' } },
      });
      stats.push(
        { label: 'Active Startups', value: activeStartups },
        { label: 'Investment Opportunities', value: activeStartups },
        { label: 'Cohorts', value: await prisma.cohort.count({
          where: { status: 'ACTIVE' },
        }) }
      );
      break;

    case 'MENTOR':
      const mentorStartups = await prisma.startup.count({
        where: { cohort: { status: 'ACTIVE' } },
      });
      stats.push(
        { label: 'Startups to Mentor', value: mentorStartups },
        { label: 'Active Cohorts', value: await prisma.cohort.count({
          where: { status: 'ACTIVE' },
        }) },
        { label: 'Applications', value: await prisma.application.count() }
      );
      break;

    default:
      stats.push(
        { label: 'Welcome', value: '👋' },
        { label: 'Role', value: role },
        { label: 'Status', value: 'Active' }
      );
  }

  return stats;
}