import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PLANS, normalizePlanId, type PlanId } from '@/plans';
import { he } from '@/i18n/he';
import { supabase } from '@/supabase/client';
import { isAdminEmail } from '@/hooks/useAuth';
import { formatDateHe } from '@/utils/date';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  plan: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(false);

    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, created_at, plan')
      .order('created_at', { ascending: false });

    if (err || !data) {
      setError(true);
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handlePlanChange = async (userId: string, plan: PlanId) => {
    if (!supabase) return;
    setUpdatingId(userId);
    const { error: err } = await supabase.rpc('admin_set_plan', {
      p_user_id: userId,
      p_plan: plan,
    });
    setUpdatingId(null);
    if (err) {
      window.alert(he.admin.planUpdateError);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan } : u)));
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading}>
          🔄 {he.admin.refresh}
        </Button>
        <h3 className="text-sm font-semibold text-notion-text text-right">{he.admin.title}</h3>
      </div>

      {loading ? (
        <p className="text-xs text-notion-muted text-right">{he.common.loading}</p>
      ) : error ? (
        <p className="text-xs text-red-500 text-right">{he.admin.loadError}</p>
      ) : (
        <>
          <Card>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-notion-text">{users.length}</span>
              <span className="text-notion-muted">{he.admin.usersCount}</span>
            </div>
          </Card>

          {users.length === 0 ? (
            <p className="text-xs text-notion-muted text-right">{he.admin.empty}</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto wa-lh-scroll">
              {users.map((user) => {
                const planId = normalizePlanId(user.plan);
                return (
                  <Card key={user.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <select
                        value={planId}
                        disabled={updatingId === user.id}
                        onChange={(e) => handlePlanChange(user.id, e.target.value as PlanId)}
                        className="text-xs border border-notion-border rounded-lg px-2 py-1 bg-notion-bg text-notion-text shrink-0"
                        dir="ltr"
                      >
                        <option value="free">{PLANS.free.name}</option>
                        <option value="pro">{PLANS.pro.name}</option>
                        <option value="unlimited">{PLANS.unlimited.name}</option>
                      </select>
                      <div className="flex-1 text-right min-w-0">
                        <p className="text-sm font-medium text-notion-text truncate" dir="ltr">
                          {user.email}
                        </p>
                        <p className="text-xs text-notion-muted mt-0.5">
                          {he.admin.registeredAt}: {formatDateHe(user.created_at)}
                        </p>
                        <p className="text-xs text-notion-muted">
                          {he.admin.plan}: {PLANS[planId].name}
                        </p>
                      </div>
                      {isAdminEmail(user.email) && (
                        <span className="text-[10px] font-bold text-white bg-notion-accent rounded-full px-2 py-0.5 shrink-0">
                          {he.admin.adminBadge}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
