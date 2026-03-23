import Sidebar from '@/components/shared/Sidebar'
import MobileToggle from '@/components/shared/MobileToggle'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="jc-layout">
      <Sidebar role="staff" />
      <div className="jc-layout-main flex flex-col flex-1 overflow-hidden">
        <MobileToggle role="staff" />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
