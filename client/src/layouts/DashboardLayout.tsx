import { ReactNode, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { Sidebar } from '../components/Sidebar';
import { CommandPalette } from '../components/ui/command-palette';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useScreenSize } from '../hooks/useScreenSize';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import { Separator } from '../components/ui/separator';
import { PageContainer } from '../components/layout/PageContainer';
import { LayoutDiagnosticProvider } from '../components/layout/LayoutDiagnosticProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isMobile } = useScreenSize();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onEscape: () => setCommandPaletteOpen(false),
  });

  return (
    <LayoutDiagnosticProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex h-dvh w-full overflow-hidden bg-background font-sans text-foreground">
          {/* New Shadcn Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <SidebarInset className="bg-background flex flex-col flex-1 min-h-0 overflow-hidden transition-all duration-300">

            {/* Header - Sticky with proper z-index and border */}
            <header className="h-14 flex items-center border-b border-border bg-card/80 backdrop-blur-md px-4 shrink-0 z-30 sticky top-0">
              <div className="flex items-center gap-2 mr-4">
                <SidebarTrigger className="-ml-1 text-muted-foreground w-8 h-8" />
                <Separator orientation="vertical" className="h-4 mr-2" />
              </div>

              <div className="flex-1">
                <DashboardHeader
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              </div>
            </header>

            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />

            {/* Canvas Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 scroll-smooth">
              <PageContainer variant="fluid">
                {children}
              </PageContainer>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </LayoutDiagnosticProvider>
  );
}
