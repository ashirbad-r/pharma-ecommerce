import { useState, useEffect } from 'react';
import { getPrescriptions, verifyPrescription } from '../api/index';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    setLoading(true);
    getPrescriptions({ status: filter || undefined })
      .then(res => setPrescriptions(res.data.prescriptions))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleVerify = async (id, action) => {
    try {
      await verifyPrescription(id, action);
      toast.success(`Prescription ${action === 'approve' ? 'approved' : 'rejected'}`);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Patient</th>
              <th className="px-6 py-3 text-left">Doctor</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Expiry</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">File</th>
              {filter === 'pending' && <th className="px-6 py-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : prescriptions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No prescriptions found</td></tr>
            ) : prescriptions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.first_name} {p.last_name}<br/><span className="text-xs text-gray-400">{p.email}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.doctor_name || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.prescription_date).toLocaleDateString('en-IN')}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.expiry_date).toLocaleDateString('en-IN')}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-6 py-4">
                  {p.file_url ? <a href={p.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">View</a> : '—'}
                </td>
                {filter === 'pending' && (
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleVerify(p.id, 'approve')} className="text-green-600 hover:text-green-800 transition-colors flex items-center gap-1 text-sm font-medium">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleVerify(p.id, 'reject')} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-medium">
                      <XCircle size={16} /> Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
