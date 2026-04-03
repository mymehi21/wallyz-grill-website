import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalReviews: number;
  totalCareerApplications: number;
  totalCateringRequests: number;
}

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalReviews: 0,
    totalCareerApplications: 0,
    totalCateringRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const [ordersRes, reviewsRes, careersRes, cateringRes] = await Promise.all([
        supabase.from('orders').select('id, status', { count: 'exact' }).is('deleted_at', null),
        supabase.from('reviews').select('id', { count: 'exact' }).is('deleted_at', null),
        supabase.from('career_applications').select('id', { count: 'exact' }).is('deleted_at', null),
        supabase.from('catering_requests').select('id', { count: 'exact' }).is('deleted_at', null),
      ]);

      const pendingOrders = ordersRes.data?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalOrders: ordersRes.count || 0,
        pendingOrders,
        totalReviews: reviewsRes.count || 0,
        totalCareerApplications: careersRes.count || 0,
        totalCateringRequests: cateringRes.count || 0,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load dashboard stats');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            onLogout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Wally's Grill</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            color="#3b82f6"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            color="#f59e0b"
          />
          <StatCard
            title="Reviews"
            value={stats.totalReviews}
            color="#10b981"
          />
          <StatCard
            title="Career Applications"
            value={stats.totalCareerApplications}
            color="#8b5cf6"
          />
          <StatCard
            title="Catering Requests"
            value={stats.totalCateringRequests}
            color="#ec4899"
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📱 Mobile Admin App</Text>
          <Text style={styles.infoText}>
            Use the web dashboard at your computer for full admin features including order management,
            menu updates, and detailed reports.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d97706',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});
