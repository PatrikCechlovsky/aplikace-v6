// 🧱 Layout – přepínání mezi "sidebar" a "top" layoutem
  return (
    <div className="layout">
      {/* SIDEBAR se vykreslí jen v režimu "sidebar" */}
      {menuLayout === 'sidebar' && (
        <aside className="layout__sidebar">
          <HomeButton
            disabled={!isAuthenticated}
            onClick={handleHomeClick}
          />

          <Sidebar
            disabled={!isAuthenticated}
            activeModuleId={activeModuleId ?? undefined}
            activeSelection={activeSelection ?? undefined}
            hasUnsavedChanges={hasUnsavedChanges}
            onModuleSelect={handleModuleSelect}
          />
        </aside>
      )}

      <header className="layout__topbar">
        <div className="layout__topbar-inner">
          <div className="layout__topbar-left">
            {/* V režimu TOP zobrazíme HomeButton tady, aby nechyběl */}
            {menuLayout === 'top' && (
              <HomeButton
                disabled={!isAuthenticated}
                onClick={handleHomeClick}
              />
            )}

            <Breadcrumbs
              disabled={!isAuthenticated}
              segments={getBreadcrumbSegments()}
            />
          </div>

          <div className="layout__topbar-right">
            <HomeActions
              disabled={!isAuthenticated}
              onLogout={handleLogout}
              displayName={displayName}
              onForceSidebar={forceSidebarLayout}   // ⬅️ přidáno
            />
          </div>
        </div>
      </header>

      <div className="layout__actions">
        {/* V režimu TOP zobrazíme modulovou lištu nad běžnými actions */}
        {menuLayout === 'top' && (
          <TopMenu
            modules={modules}
            activeModuleId={activeModuleId ?? undefined}
            onSelectModule={(id) =>
              handleModuleSelect({ moduleId: id })
            }
          />
        )}

        <CommonActions
          disabled={!isAuthenticated}
          actions={commonActions}
        />
      </div>

      <main className="layout__content">{renderContent()}</main>
    </div>
  )
}
