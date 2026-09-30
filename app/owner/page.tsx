import Access from '../access';
import OwnerDashboard from '../owner-dashboard';
export default function Page(){return <Access scope="owner"><OwnerDashboard/></Access>}
