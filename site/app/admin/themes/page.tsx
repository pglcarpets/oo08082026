import { ThemeEditor } from "./ThemeEditor";

export const metadata = {
  title: "Theme Manager | Oando Admin",
};

export default function AdminThemesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">System · planner materials</p>
          <h1 className="admin-page__title">Theme Manager</h1>
          <p className="admin-page__copy">
            Browse planner material tokens (woods, metals, fabrics, lighting) and
            publish a pack to the CDN. Token editing is read-only for now — use
            Publish starter pack when the list is empty. This does not change the
            admin shell or marketing site theme.
          </p>
        </div>
      </header>
      <ThemeEditor />
    </div>
  );
}
