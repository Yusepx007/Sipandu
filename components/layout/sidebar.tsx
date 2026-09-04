'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard,
  FileText,
  Users,
  MapPin,
  ClipboardCheck,
  PlusCircle,
  BarChart3,
  LogOut,
  Building2,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  profile: Profile
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'admin_kelurahan':
      return [
        { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/laporan/masuk', label: 'Laporan', icon: <FileText className="w-4 h-4" /> },
        { href: '/admin/wilayah', label: 'Master Wilayah', icon: <MapPin className="w-4 h-4" /> },
        { href: '/admin/pengguna', label: 'Pengguna', icon: <Users className="w-4 h-4" /> },
        { href: '/admin/laporan-kinerja', label: 'Lap. Kinerja', icon: <BarChart3 className="w-4 h-4" /> },
      ]
    case 'ketua_rw':
      return [
        { href: '/rw', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/rw/verifikasi', label: 'Verifikasi Laporan', icon: <ClipboardCheck className="w-4 h-4" /> },
        { href: '/laporan/masuk', label: 'Semua Laporan', icon: <FileText className="w-4 h-4" /> },
      ]
    case 'ketua_rt':
      return [
        { href: '/rt', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/rt/input', label: 'Input Laporan', icon: <PlusCircle className="w-4 h-4" /> },
        { href: '/laporan/masuk', label: 'Riwayat Laporan', icon: <FileText className="w-4 h-4" /> },
      ]
    default:
      return []
  }
}

function getRoleBadge(role: string): { label: string; color: string } {
  switch (role) {
    case 'admin_kelurahan':
      return { label: 'Admin Kelurahan', color: 'text-blue-700 bg-blue-50 border-blue-200' }
    case 'ketua_rw':
      return { label: 'Ketua RW', color: 'text-purple-700 bg-purple-50 border-purple-200' }
    case 'ketua_rt':
      return { label: 'Ketua RT', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    default:
      return { label: 'Pengguna', color: 'text-gray-600 bg-gray-50 border-gray-200' }
  }
}

function getWilayahLabel(profile: Profile): string {
  if (profile.role === 'admin_kelurahan') {
    return profile.kelurahan?.nama || 'Kelurahan'
  }
  if (profile.role === 'ketua_rw' && profile.rw) {
    return `RW ${profile.rw.nomor}`
  }
  if (profile.role === 'ketua_rt' && profile.rt) {
    return `RT ${profile.rt.nomor} / RW ${profile.rt.rw?.nomor || ''}`
  }
  return ''
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = getNavItems(profile.role)
  const roleBadge = getRoleBadge(profile.role)
  const wilayahLabel = getWilayahLabel(profile)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col"
      style={{ background: 'hsl(var(--sidebar-bg))', borderRight: '1px solid hsl(var(--sidebar-border))' }}>
      
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Sipandu</p>
            <p className="text-xs text-muted-foreground">Kel. Setiamulya</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border mb-2 ${roleBadge.color}`}>
          <Shield className="w-3 h-3" />
          {roleBadge.label}
        </div>
        <p className="font-semibold text-sm text-foreground truncate">{profile.nama}</p>
        {wilayahLabel && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{wilayahLabel}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && item.href !== '/rw' && item.href !== '/rt' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-item', isActive && 'active')}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <button
          id="btn-logout"
          onClick={handleLogout}
          className="sidebar-item w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
