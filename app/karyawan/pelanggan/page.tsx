import Access from '../../access';
import CustomerData from '../../customer-data';
export default function Page(){return <Access scope="staff"><Access scope="customers"><CustomerData/></Access></Access>}
