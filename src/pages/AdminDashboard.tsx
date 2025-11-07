import { useState, useEffect } from 'react';
import { LogOut, ShoppingBag, Truck, Users, Star, Menu as MenuIcon, X, Printer, Trash2, RotateCcw, Archive, Search, ArrowUpDown, Calendar, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfirmDialog from '../components/ConfirmDialog';
import ViewModeSelector, { ViewMode } from '../components/ViewModeSelector';
import { groupItemsByDate, sortDateGroups, getFormattedTime, formatTimeTo12Hour } from '../utils/dateUtils';
import MenuManagement from '../components/MenuManagement';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('orders');
  const [deletedSubTab, setDeletedSubTab] = useState('menu');
  const [cateringSubTab, setCateringSubTab] = useState<'party-trays' | 'food-truck'>('party-trays');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [cateringOrders, setCateringOrders] = useState<any[]>([]);
  const [foodTruckRequests, setFoodTruckRequests] = useState<any[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'name-az' | 'name-za'>('oldest');
  const [selectedItem, setSelectedItem] = useState<{item: any, table: string} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, cateringRes, truckRes, jobsRes, reviewsRes] = await Promise.all([
        supabase.from('pickup_orders').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('catering_menu_orders').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('food_truck_requests').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('job_applications').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('customer_reviews').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
      ]);

      if (ordersRes.data) setPickupOrders(ordersRes.data);
      if (cateringRes.data) setCateringOrders(cateringRes.data);
      if (truckRes.data) setFoodTruckRequests(truckRes.data);
      if (jobsRes.data) setJobApplications(jobsRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);

      await fetchDeletedItems();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedItems = async () => {
    try {
      const [ordersRes, cateringRes, truckRes, jobsRes, reviewsRes, menuRes] = await Promise.all([
        supabase.from('pickup_orders').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('catering_menu_orders').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('food_truck_requests').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('job_applications').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('customer_reviews').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('menu_items').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
      ]);

      const deleted = [
        ...(ordersRes.data || []).map(item => ({ ...item, type: 'Pickup Order' })),
        ...(cateringRes.data || []).map(item => ({ ...item, type: 'Catering Order' })),
        ...(truckRes.data || []).map(item => ({ ...item, type: 'Food Truck Request' })),
        ...(jobsRes.data || []).map(item => ({ ...item, type: 'Job Application' })),
        ...(reviewsRes.data || []).map(item => ({ ...item, type: 'Customer Review' })),
        ...(menuRes.data || []).map(item => ({ ...item, type: 'Menu Item' }))
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      setDeletedItems(deleted);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    }
  };

  const handleSoftDelete = (id: string, table: string, itemName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move to Deleted',
      message: `Are you sure you want to move "${itemName}" to the deleted items? You can restore it later from the Deleted tab.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { error } = await supabase
            .from(table)
            .update({
              deleted_at: new Date().toISOString(),
              deleted_by: user?.id
            })
            .eq('id', id);

          if (error) {
            console.error('Error soft deleting:', error);
            alert(`Failed to delete: ${error.message}`);
          } else {
            await fetchAllData();
          }
        } catch (error) {
          console.error('Error soft deleting:', error);
          alert('Failed to delete item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleRestore = (id: string, table: string, itemName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Item',
      message: `Are you sure you want to restore "${itemName}"?`,
      variant: 'info',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from(table)
            .update({
              deleted_at: null,
              deleted_by: null
            })
            .eq('id', id);

          if (error) {
            console.error('Error restoring:', error);
            alert(`Failed to restore: ${error.message}`);
          } else {
            await fetchAllData();
          }
        } catch (error) {
          console.error('Error restoring:', error);
          alert('Failed to restore item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handlePermanentDelete = (id: string, table: string, itemName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanent Delete',
      message: `Are you sure you want to PERMANENTLY delete "${itemName}"? This action CANNOT be undone!`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from(table).delete().eq('id', id);

          if (error) {
            console.error('Error permanently deleting:', error);
            alert(`Failed to permanently delete: ${error.message}`);
          } else {
            await fetchAllData();
          }
        } catch (error) {
          console.error('Error permanently deleting:', error);
          alert('Failed to permanently delete item');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const getTableName = (type: string): string => {
    const tableMap: { [key: string]: string } = {
      'Pickup Order': 'pickup_orders',
      'Catering Order': 'catering_menu_orders',
      'Food Truck Request': 'food_truck_requests',
      'Job Application': 'job_applications',
      'Customer Review': 'customer_reviews',
      'Menu Item': 'menu_items'
    };
    return tableMap[type] || '';
  };

  const getItemDisplayName = (item: any): string => {
    return item.customer_name || item.applicant_name || item.name || 'Unknown';
  };

  const handlePrint = (content: any, type: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getOrderType = () => {
      if (type === 'pickup_orders') return 'PICKUP ORDER';
      if (type === 'catering_menu_orders') return 'CATERING ORDER';
      if (type === 'food_truck_requests') return 'FOOD TRUCK REQUEST';
      if (type === 'job_applications') return 'JOB APPLICATION';
      if (type === 'customer_reviews') return 'CUSTOMER REVIEW';
      return 'ORDER';
    };

    const formatOrderItems = () => {
      if (!content.order_items) return '';

      const items = typeof content.order_items === 'string'
        ? JSON.parse(content.order_items)
        : content.order_items;

      if (!Array.isArray(items)) return '';

      return items.map((item: any, index: number) => {
        let itemHtml = `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <strong>${item.name}</strong>
              ${item.customizations ? `<br><span style="font-size: 12px; color: #666;">
                ${item.customizations.add?.length > 0 ? `<br>Add: ${item.customizations.add.join(', ')}` : ''}
                ${item.customizations.remove?.length > 0 ? `<br>Remove: ${item.customizations.remove.join(', ')}` : ''}
              </span>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.price).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>$${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</strong></td>
          </tr>
        `;
        return itemHtml;
      }).join('');
    };

    let html = `
      <html>
        <head>
          <title>Print ${getOrderType()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              border-bottom: 4px solid #f97316;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #f97316;
              font-size: 32px;
              margin-bottom: 5px;
            }
            .header .order-type {
              color: #6b7280;
              font-size: 18px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              background-color: #f97316;
              color: white;
              padding: 10px 15px;
              font-size: 16px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 15px;
              border-radius: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px 30px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 15px;
              color: #1f2937;
              font-weight: 500;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .items-table th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            .items-table th:nth-child(3),
            .items-table th:nth-child(4),
            .items-table th:nth-child(5) {
              text-align: right;
            }
            .items-table th:nth-child(3) {
              text-align: center;
            }
            .total-section {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: right;
            }
            .total-row {
              font-size: 24px;
              font-weight: 700;
              color: #f97316;
              margin-top: 10px;
            }
            .notes-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-top: 10px;
              border-radius: 4px;
            }
            .notes-box .label {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 8px;
            }
            .notes-box .content {
              color: #78350f;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              background-color: #fbbf24;
              color: #78350f;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Wallyz Grill</h1>
            <div class="order-type">${getOrderType()}</div>
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-grid">
              ${content.customer_name || content.applicant_name ? `
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${content.customer_name || content.applicant_name}</div>
                </div>
              ` : ''}
              ${content.customer_email || content.applicant_email ? `
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${content.customer_email || content.applicant_email}</div>
                </div>
              ` : ''}
              ${content.customer_phone || content.applicant_phone ? `
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${content.customer_phone || content.applicant_phone}</div>
                </div>
              ` : ''}
            </div>
          </div>

          ${content.pickup_time || content.event_date || content.event_time || content.event_location || content.guest_count ? `
            <div class="section">
              <div class="section-title">Event Details</div>
              <div class="info-grid">
                ${content.pickup_time ? `
                  <div class="info-item">
                    <div class="info-label">Pickup Time</div>
                    <div class="info-value">${formatTimeTo12Hour(content.pickup_time)}</div>
                  </div>
                ` : ''}
                ${content.event_date ? `
                  <div class="info-item">
                    <div class="info-label">Event Date</div>
                    <div class="info-value">${content.event_date}</div>
                  </div>
                ` : ''}
                ${content.event_time ? `
                  <div class="info-item">
                    <div class="info-label">Event Time</div>
                    <div class="info-value">${formatTimeTo12Hour(content.event_time)}</div>
                  </div>
                ` : ''}
                ${content.event_location ? `
                  <div class="info-item">
                    <div class="info-label">Event Location</div>
                    <div class="info-value">${content.event_location}</div>
                  </div>
                ` : ''}
                ${content.guest_count ? `
                  <div class="info-item">
                    <div class="info-label">Number of Guests</div>
                    <div class="info-value">${content.guest_count} people</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${content.order_items ? `
            <div class="section">
              <div class="section-title">Order Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Item</th>
                    <th style="width: 80px;">Qty</th>
                    <th style="width: 100px;">Price</th>
                    <th style="width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${formatOrderItems()}
                </tbody>
              </table>

              ${content.total_amount ? `
                <div class="total-section">
                  <div class="total-row">
                    Total: $${Number(content.total_amount).toFixed(2)}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${content.position_applied ? `
            <div class="section">
              <div class="section-title">Position Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Position Applied For</div>
                  <div class="info-value">${content.position_applied}</div>
                </div>
                ${content.experience ? `
                  <div class="info-item">
                    <div class="info-label">Experience</div>
                    <div class="info-value">${content.experience}</div>
                  </div>
                ` : ''}
                ${content.availability ? `
                  <div class="info-item">
                    <div class="info-label">Availability</div>
                    <div class="info-value">${content.availability}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${content.rating ? `
            <div class="section">
              <div class="section-title">Review</div>
              <div class="info-item" style="margin-bottom: 10px;">
                <div class="info-label">Rating</div>
                <div class="info-value" style="color: #f97316; font-size: 18px;">
                  ${'★'.repeat(content.rating)}${'☆'.repeat(5 - content.rating)} (${content.rating}/5)
                </div>
              </div>
              ${content.review_text ? `
                <div class="info-item">
                  <div class="info-label">Review</div>
                  <div class="info-value">${content.review_text}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${content.special_instructions || content.additional_info ? `
            <div class="section">
              <div class="notes-box">
                <div class="label">Special Instructions / Additional Notes:</div>
                <div class="content">${content.special_instructions || content.additional_info}</div>
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Order placed on ${formatDate(content.created_at)}</p>
            <p style="margin-top: 8px;">Thank you for choosing Wallyz Grill!</p>
            <p style="margin-top: 4px; font-size: 11px;">This is a computer-generated document.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const toggleReviewApproval = async (reviewId: string, currentStatus: boolean) => {
    await supabase
      .from('customer_reviews')
      .update({ is_approved: !currentStatus })
      .eq('id', reviewId);
    fetchAllData();
  };

  const renderItemCard = (item: any, table: string, showDelete: boolean = true) => {
    const itemName = getItemDisplayName(item);

    return (
      <div key={item.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">{itemName}</h3>
            {item.position_applied && (
              <p className="text-orange-500">{item.position_applied}</p>
            )}
            {item.rating && (
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < item.rating ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}
                  />
                ))}
              </div>
            )}
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
              <Calendar size={14} />
              {getFormattedTime(item.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            {showDelete && (
              <button
                onClick={() => handleSoftDelete(item.id, table, itemName)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                title="Move to deleted"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => handlePrint(item, table)}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
              title="Print"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {item.customer_email && (
            <div>
              <p className="text-gray-400">Email:</p>
              <p className="text-white break-all">{item.customer_email}</p>
            </div>
          )}
          {item.applicant_email && (
            <div>
              <p className="text-gray-400">Email:</p>
              <p className="text-white break-all">{item.applicant_email}</p>
            </div>
          )}
          {item.customer_phone && (
            <div>
              <p className="text-gray-400">Phone:</p>
              <p className="text-white">{item.customer_phone}</p>
            </div>
          )}
          {item.applicant_phone && (
            <div>
              <p className="text-gray-400">Phone:</p>
              <p className="text-white">{item.applicant_phone}</p>
            </div>
          )}
          {item.pickup_time && (
            <div>
              <p className="text-gray-400">Pickup Time:</p>
              <p className="text-white">{formatTimeTo12Hour(item.pickup_time)}</p>
            </div>
          )}
          {item.event_date && (
            <div>
              <p className="text-gray-400">Event Date:</p>
              <p className="text-white">{item.event_date}</p>
            </div>
          )}
          {item.total_amount && (
            <div>
              <p className="text-gray-400">Total:</p>
              <p className="text-white font-bold">${item.total_amount}</p>
            </div>
          )}
          {item.guest_count && (
            <div>
              <p className="text-gray-400">Guest Count:</p>
              <p className="text-white">{item.guest_count}</p>
            </div>
          )}
          {item.event_location && (
            <div className="col-span-2">
              <p className="text-gray-400">Location:</p>
              <p className="text-white">{item.event_location}</p>
            </div>
          )}
        </div>

        {item.review_text && (
          <div className="mt-4">
            <p className="text-white">{item.review_text}</p>
            {table === 'customer_reviews' && (
              <button
                onClick={() => toggleReviewApproval(item.id, item.is_approved)}
                className={`mt-3 px-4 py-2 rounded-lg font-semibold ${
                  item.is_approved
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                {item.is_approved ? 'Approved' : 'Pending'}
              </button>
            )}
          </div>
        )}

        {item.order_items && (
          <div className="mt-4">
            <p className="text-gray-400 text-sm mb-2">Order Items:</p>
            <div className="bg-gray-900 rounded p-3 text-white text-sm">
              <pre className="whitespace-pre-wrap">{formatOrderItems(item.order_items)}</pre>
            </div>
          </div>
        )}

        {item.experience && (
          <div className="mt-4">
            <p className="text-gray-400 text-sm">Experience:</p>
            <p className="text-white">{item.experience}</p>
          </div>
        )}

        {item.availability && (
          <div className="mt-4">
            <p className="text-gray-400 text-sm">Availability:</p>
            <p className="text-white">{item.availability}</p>
          </div>
        )}

        {(item.special_instructions || item.additional_info) && (
          <div className="mt-4">
            <p className="text-gray-400 text-sm">Additional Info:</p>
            <p className="text-white">{item.special_instructions || item.additional_info}</p>
          </div>
        )}
      </div>
    );
  };

  const formatOrderItems = (orderItems: any) => {
    if (!orderItems) return '';

    try {
      const items = typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
      if (!Array.isArray(items)) return '';

      return items.map((item: any, index: number) => {
        let itemStr = `${index + 1}. ${item.name} - $${item.price}`;
        if (item.quantity > 1) itemStr += ` (x${item.quantity})`;

        if (item.customizations) {
          const adds = item.customizations.add || [];
          const removes = item.customizations.remove || [];

          if (adds.length > 0) {
            itemStr += `\n   Add: ${adds.join(', ')}`;
          }
          if (removes.length > 0) {
            itemStr += `\n   Remove: ${removes.join(', ')}`;
          }
        }

        return itemStr;
      }).join('\n');
    } catch {
      return 'Unable to parse order items';
    }
  };

  const renderItemGrid = (item: any, table: string, showDelete: boolean = true) => {
    const itemName = getItemDisplayName(item);

    return (
      <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500 transition-all">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-white truncate flex-1">{itemName}</h3>
          {showDelete && (
            <button
              onClick={() => handleSoftDelete(item.id, table, itemName)}
              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded ml-2 flex-shrink-0"
              title="Move to deleted"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {item.rating && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < item.rating ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}
              />
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {(item.customer_email || item.applicant_email) && (
            <p className="text-gray-400 truncate">{item.customer_email || item.applicant_email}</p>
          )}
          {(item.customer_phone || item.applicant_phone) && (
            <p className="text-gray-400 truncate">{item.customer_phone || item.applicant_phone}</p>
          )}
          {item.total_amount && (
            <p className="text-orange-500 font-bold">${item.total_amount}</p>
          )}
          {item.position_applied && (
            <p className="text-orange-500 text-xs">{item.position_applied}</p>
          )}
          {item.pickup_time && (
            <p className="text-gray-400 text-xs">Pickup: {formatTimeTo12Hour(item.pickup_time)}</p>
          )}
          {item.event_date && (
            <p className="text-gray-400 text-xs">Event: {item.event_date}</p>
          )}
          <p className="text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString()}</p>
        </div>

        <button
          onClick={() => setSelectedItem({item, table})}
          className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-sm transition-colors"
        >
          View Details
        </button>
      </div>
    );
  };

  const renderItemCompact = (item: any, table: string, showDelete: boolean = true) => {
    const itemName = getItemDisplayName(item);

    return (
      <div key={item.id} className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 flex items-center justify-between hover:border-orange-500 transition-all cursor-pointer group">
        <div
          className="flex items-center gap-4 flex-1 min-w-0"
          onClick={() => setSelectedItem({item, table})}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate group-hover:text-orange-500 transition-colors">{itemName}</h3>
            <p className="text-gray-400 text-sm truncate">
              {item.customer_email || item.applicant_email || new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>

          {item.total_amount && (
            <div className="text-orange-500 font-bold whitespace-nowrap">${item.total_amount}</div>
          )}

          {item.rating && (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < item.rating ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(item, table);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
            title="Print"
          >
            <Printer size={16} />
          </button>
          {showDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSoftDelete(item.id, table, itemName);
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
              title="Move to deleted"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const sortItems = (items: any[], sortType: string) => {
    const sorted = [...items];

    switch (sortType) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.total_amount || a.total_price || 0));
          const priceB = parseFloat(String(b.total_amount || b.total_price || 0));
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.total_amount || a.total_price || 0));
          const priceB = parseFloat(String(b.total_amount || b.total_price || 0));
          return priceB - priceA;
        });
      case 'name-az':
        return sorted.sort((a, b) => {
          const nameA = (a.customer_name || a.applicant_name || '').toLowerCase();
          const nameB = (b.customer_name || b.applicant_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'name-za':
        return sorted.sort((a, b) => {
          const nameA = (a.customer_name || a.applicant_name || '').toLowerCase();
          const nameB = (b.customer_name || b.applicant_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      default:
        return sorted;
    }
  };

  const filterItems = (items: any[]) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      const name = (item.customer_name || item.applicant_name || '').toLowerCase();
      const email = (item.customer_email || item.applicant_email || '').toLowerCase();
      const id = (item.id || '').toLowerCase();
      const phone = (item.customer_phone || item.applicant_phone || '').toLowerCase();

      return name.includes(query) || email.includes(query) || id.includes(query) || phone.includes(query);
    });
  };

  const renderItems = (items: any[], table: string, title: string, showDelete: boolean = true) => {
    const filteredItems = filterItems(items);
    const sortedItems = sortItems(filteredItems, sortBy);

    if (sortedItems.length === 0) {
      return <p className="text-gray-400">{searchQuery ? 'No matching results' : `No ${title.toLowerCase()} yet`}</p>;
    }

    const groupedByDate = groupItemsByDate(sortedItems);
    const sortedGroups = sortDateGroups(groupedByDate);

    return (
      <div className="space-y-8">
        {sortedGroups.map(([dateLabel, dateItems]) => (
          <div key={dateLabel}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-orange-500 px-4 py-2 rounded-lg">
                <Calendar size={20} className="text-white" />
                <h3 className="text-lg font-bold text-white">{dateLabel}</h3>
              </div>
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-400 text-sm font-semibold">{dateItems.length} item{dateItems.length > 1 ? 's' : ''}</span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateItems.map(item => renderItemGrid(item, table, showDelete))}
              </div>
            ) : viewMode === 'compact' ? (
              <div className="space-y-2">
                {dateItems.map(item => renderItemCompact(item, table, showDelete))}
              </div>
            ) : (
              <div className="space-y-4">
                {dateItems.map(item => renderItemCard(item, table, showDelete))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderOrders = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-white">Pickup Orders</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="newest">Latest First</option>
              <option value="oldest">Earliest First</option>
              <option value="price-high">$$ Highest</option>
              <option value="price-low">$ Lowest</option>
              <option value="name-az">A → Z</option>
              <option value="name-za">Z → A</option>
            </select>
          </div>
          <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>
      {renderItems(pickupOrders, 'pickup_orders', 'Pickup Orders')}
    </div>
  );

  const renderCatering = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Catering Services</h2>

      <div className="flex gap-3 border-b border-gray-700 mb-6">
        <button
          onClick={() => setCateringSubTab('party-trays')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            cateringSubTab === 'party-trays'
              ? 'text-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Party Trays
          {cateringSubTab === 'party-trays' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
          )}
        </button>
        <button
          onClick={() => setCateringSubTab('food-truck')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            cateringSubTab === 'food-truck'
              ? 'text-orange-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Food Truck Services
          {cateringSubTab === 'food-truck' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
          )}
        </button>
      </div>

      {cateringSubTab === 'party-trays' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xl font-bold text-white">Party Tray Orders</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="oldest">Earliest First</option>
                  <option value="price-high">$$ Highest</option>
                  <option value="price-low">$ Lowest</option>
                  <option value="name-az">A → Z</option>
                  <option value="name-za">Z → A</option>
                </select>
              </div>
              <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
            </div>
          </div>
          {renderItems(cateringOrders, 'catering_menu_orders', 'Party Tray Orders')}
        </div>
      )}

      {cateringSubTab === 'food-truck' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xl font-bold text-white">Food Truck Requests</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="oldest">Earliest First</option>
                  <option value="price-high">$$ Highest</option>
                  <option value="price-low">$ Lowest</option>
                  <option value="name-az">A → Z</option>
                  <option value="name-za">Z → A</option>
                </select>
              </div>
              <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
            </div>
          </div>
          {renderItems(foodTruckRequests, 'food_truck_requests', 'Food Truck Requests')}
        </div>
      )}
    </div>
  );

  const renderJobApplications = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-white">Job Applications</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="newest">Recent First</option>
              <option value="oldest">Older First</option>
              <option value="name-az">Name A-Z</option>
              <option value="name-za">Name Z-A</option>
            </select>
          </div>
          <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>
      {renderItems(jobApplications, 'job_applications', 'Job Applications')}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="newest">Newest Reviews</option>
              <option value="oldest">Oldest Reviews</option>
              <option value="name-az">Reviewer A-Z</option>
              <option value="name-za">Reviewer Z-A</option>
            </select>
          </div>
          <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
        </div>
      </div>
      {renderItems(reviews, 'customer_reviews', 'Reviews')}
    </div>
  );

  const renderDeletedItems = () => {
    const filteredByType = deletedItems.filter(item => {
      if (deletedSubTab === 'menu') return item.type === 'Menu Item';
      if (deletedSubTab === 'orders') return item.type === 'Pickup Order';
      if (deletedSubTab === 'catering') return item.type === 'Catering Order';
      if (deletedSubTab === 'jobs') return item.type === 'Job Application';
      if (deletedSubTab === 'reviews') return item.type === 'Customer Review';
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Deleted Items</h2>

          <div className="flex gap-2 flex-wrap bg-gray-800 p-2 rounded-lg">
            <button
              onClick={() => setDeletedSubTab('menu')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deletedSubTab === 'menu'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 inline mr-2" />
              Menu
            </button>
            <button
              onClick={() => setDeletedSubTab('orders')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deletedSubTab === 'orders'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              Pickup Orders
            </button>
            <button
              onClick={() => setDeletedSubTab('catering')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deletedSubTab === 'catering'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Catering
            </button>
            <button
              onClick={() => setDeletedSubTab('jobs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deletedSubTab === 'jobs'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Job Applications
            </button>
            <button
              onClick={() => setDeletedSubTab('reviews')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                deletedSubTab === 'reviews'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Reviews
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 text-white pl-10 pr-8 py-2 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="newest">Recently Deleted</option>
                <option value="oldest">First Deleted</option>
                <option value="name-az">Name A-Z</option>
                <option value="name-za">Name Z-A</option>
              </select>
            </div>
            <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
          </div>
        </div>

        {filteredByType.length === 0 ? (
          <p className="text-gray-400">No deleted items in this category</p>
        ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {filteredByType.map((item) => {
            const itemName = getItemDisplayName(item);
            const table = getTableName(item.type);

            return (
              <div key={`${item.type}-${item.id}`} className="bg-gray-800 rounded-lg p-6 border border-red-900">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-semibold mb-2">
                      {item.type}
                    </span>
                    <h3 className="text-xl font-semibold text-white">{itemName}</h3>
                    <p className="text-gray-400 text-sm">Deleted: {new Date(item.deleted_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(item.id, table, itemName)}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id, table, itemName)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  {(item.customer_email || item.applicant_email) && (
                    <p className="text-gray-400">
                      Email: <span className="text-white">{item.customer_email || item.applicant_email}</span>
                    </p>
                  )}
                  {item.total_amount && (
                    <p className="text-gray-400">
                      Total: <span className="text-orange-500 font-bold">${item.total_amount}</span>
                    </p>
                  )}
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < item.rating ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.variant === 'danger' ? 'Delete Permanently' : confirmDialog.variant === 'info' ? 'Restore' : 'Move to Deleted'}
      />

      <div className="flex">
        <div
          className={`fixed inset-y-0 left-0 z-50 bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-xl font-bold">
                <span className="text-orange-500">WALLYZ</span> ADMIN
              </h1>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                <X size={24} />
              </button>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <ShoppingBag size={20} />
                Pickup Orders
              </button>

              <button
                onClick={() => setActiveTab('catering')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'catering' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Truck size={20} />
                Catering
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'jobs' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Users size={20} />
                Job Applications
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'reviews' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Star size={20} />
                Reviews
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'menu' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <UtensilsCrossed size={20} />
                Menu
              </button>

              <button
                onClick={() => setActiveTab('deleted')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'deleted' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Archive size={20} />
                Deleted Items
                {deletedItems.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {deletedItems.length}
                  </span>
                )}
              </button>
            </nav>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-gray-800 transition-colors mt-8"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
              <MenuIcon size={24} />
            </button>
            <button
              onClick={fetchAllData}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading...</div>
            ) : (
              <>
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'catering' && renderCatering()}
                {activeTab === 'jobs' && renderJobApplications()}
                {activeTab === 'reviews' && renderReviews()}
                {activeTab === 'menu' && <MenuManagement onUpdate={fetchAllData} />}
                {activeTab === 'deleted' && renderDeletedItems()}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-white">Order Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(selectedItem.item, selectedItem.table)}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {renderItemCard(selectedItem.item, selectedItem.table, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
