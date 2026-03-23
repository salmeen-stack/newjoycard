import Sidebar from '@/components/shared/Sidebar'
import MobileToggle from '@/components/shared/MobileToggle'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="jc-layout">
      <Sidebar role="organizer" />
      <div className="jc-layout-main flex flex-col flex-1 overflow-hidden">
        <MobileToggle role="organizer" />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
