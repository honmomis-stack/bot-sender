import { getAdminSession } from '@/lib/auth';
import AdminDashboard from './AdminDashboard';
import LoginForm from './LoginForm';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    return <LoginForm />;
  }

  return <AdminDashboard adminEmail={session.email as string} />;
}
