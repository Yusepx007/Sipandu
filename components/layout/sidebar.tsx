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
  ChevronDown,
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
  Baby,
  Skull,
  MoveHorizontal,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SidebarProps {
  profile: Profile
}

const LAPORAN_ITEMS = [
  { href: '/laporan/masuk',          label: 'Warga Masuk',     icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
  { href: '/laporan/keluar',         label: 'Warga Keluar',    icon: <ArrowUpFromLine className="w-3.5 h-3.5" /> },
  { href: '/laporan/lahir',          label: 'Kelahiran',       icon: <Baby className="w-3.5 h-3.5" /> },
  { href: '/laporan/meninggal',      label: 'Kematian',        icon: <Skull className="w-3.5 h-3.5" /> },
  { href: '/laporan/pindahan',       label: 'Pindahan',        icon: <MoveHorizontal className="w-3.5 h-3.5" /> },
  { href: '/laporan/perubahan_data', label: 'Perubahan Data',  icon: <Pencil className="w-3.5 h-3.5" /> },
]

function getNavItems(role: string) {
  switch (role) {
    case 'admin_kelurahan':
      return [
        { href: '/admin',                 label: 'Dashboard',      icon: <LayoutDashboard className="w-4 h-4" />, sub: null },
        { href: '/laporan',               label: 'Laporan',        icon: <FileText className="w-4 h-4" />,        sub: LAPORAN_ITEMS },
        { href: '/admin/wilayah',         label: 'Master Wilayah', icon: <MapPin className="w-4 h-4" />,          sub: null },
        { href: '/admin/pengguna',        label: 'Pengguna',       icon: <Users className="w-4 h-4" />,           sub: null },
        { href: '/admin/laporan-kinerja', label: 'Lap. Kinerja',   icon: <BarChart3 className="w-4 h-4" />,       sub: null },
      ]
    case 'ketua_rw':
      return [
        { href: '/rw',              label: 'Dashboard',        icon: <LayoutDashboard className="w-4 h-4" />, sub: null },
        { href: '/rw/verifikasi',   label: 'Verifikasi',       icon: <ClipboardCheck className="w-4 h-4" />, sub: null },
        { href: '/laporan',         label: 'Semua Laporan',    icon: <FileText className="w-4 h-4" />,        sub: LAPORAN_ITEMS },
      ]
    case 'ketua_rt':
      return [
        { href: '/rt',         label: 'Dashboard',       icon: <LayoutDashboard className="w-4 h-4" />, sub: null },
        { href: '/rt/input',   label: 'Input Laporan',   icon: <PlusCircle className="w-4 h-4" />,      sub: null },
        { href: '/laporan',    label: 'Riwayat Laporan', icon: <FileText className="w-4 h-4" />,        sub: LAPORAN_ITEMS },
      ]
    default:
      return []
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin_kelurahan': return { label: 'Admin Kelurahan', color: 'text-blue-700 bg-blue-50 border-blue-200' }
    case 'ketua_rw':        return { label: 'Ketua RW',        color: 'text-purple-700 bg-purple-50 border-purple-200' }
    case 'ketua_rt':        return { label: 'Ketua RT',        color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    default:                return { label: 'Pengguna',        color: 'text-gray-600 bg-gray-50 border-gray-200' }
  }
}

function getWilayahLabel(profile: Profile): string {
  if (profile.role === 'admin_kelurahan') return profile.kelurahan?.nama || 'Kelurahan'
  if (profile.role === 'ketua_rw' && profile.rw) return `RW ${profile.rw.nomor}`
  if (profile.role === 'ketua_rt' && profile.rt) return `RT ${profile.rt.nomor} / RW ${profile.rt.rw?.nomor || ''}`
  return ''
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = getNavItems(profile.role)
  const roleBadge = getRoleBadge(profile.role)
  const wilayahLabel = getWilayahLabel(profile)

  // Auto-expand laporan submenu kalau sedang di halaman laporan
  const isOnLaporan = pathname.startsWith('/laporan')
  const [laporanOpen, setLaporanOpen] = useState(isOnLaporan)

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
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isLaporan = item.href === '/laporan'
          const isActive = !isLaporan && (
            pathname === item.href ||
            (item.href !== '/admin' && item.href !== '/rw' && item.href !== '/rt' && pathname.startsWith(item.href))
          )

          if (isLaporan && item.sub) {
            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => setLaporanOpen(!laporanOpen)}
                  className={cn(
                    'sidebar-item w-full',
                    isOnLaporan && 'text-foreground bg-accent'
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {laporanOpen
                    ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                </button>

                {/* Submenu */}
                {laporanOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 pl-4 border-l-2 border-border">
                    {item.sub.map((sub) => {
                      const subActive = pathname.startsWith(sub.href)
                      return (
                        <Link key={sub.href} href={sub.href}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                            subActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}>
                          {sub.icon}
                          {sub.label}
                          {subActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-item', isActive && 'active')}>
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

