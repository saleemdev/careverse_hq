/**
 * License utility helpers for badge colors and status formatting
 */

export const getExpiryBadge = (expiryDate: string | null | undefined) => {
  if (!expiryDate) {
    return { color: 'default', text: 'No expiry', status: 'unknown' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysToExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysToExpiry < 0) {
    return {
      color: 'error',
      text: `Expired ${Math.abs(daysToExpiry)} days ago`,
      status: 'expired',
    };
  }

  if (daysToExpiry === 0) {
    return {
      color: 'error',
      text: 'Expires today',
      status: 'expiring_soon',
    };
  }

  if (daysToExpiry <= 30) {
    return {
      color: 'error',
      text: `${daysToExpiry} days`,
      status: 'expiring_soon',
    };
  }

  if (daysToExpiry <= 60) {
    return {
      color: 'warning',
      text: `${daysToExpiry} days`,
      status: 'expiring_medium',
    };
  }

  if (daysToExpiry <= 90) {
    return {
      color: 'processing',
      text: `${daysToExpiry} days`,
      status: 'expiring_future',
    };
  }

  return {
    color: 'success',
    text: `${daysToExpiry} days`,
    status: 'active',
  };
};

export const getStatusBadge = (status: string | null | undefined) => {
  const statusColors: Record<string, string> = {
    Active: 'success',
    Expired: 'error',
    Pending: 'processing',
    Suspended: 'warning',
    Revoked: 'error',
    'Pending Renewal': 'warning',
    Renewed: 'success',
    Appealed: 'processing',
    'Under Review': 'processing',
    'Info Requested': 'warning',
    Denied: 'error',
    'Pending Payment': 'warning',
    'Payment Confirmed': 'success',
  };

  return statusColors[status || 'Unknown'] || 'default';
};

export const formatPaymentStatus = (isPaid: boolean | 0 | 1): string => {
  return isPaid ? 'Paid' : 'Pending';
};

export const getPaymentStatusColor = (isPaid: boolean | 0 | 1): string => {
  return isPaid ? 'success' : 'warning';
};

export const formatCurrency = (amount: number | string | null): string => {
  if (!amount) return 'KES 0.00';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `KES ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
