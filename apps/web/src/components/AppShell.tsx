import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Inbox,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  Tags,
  Search,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  Hash,
} from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { api, type ProjectDTO, type TagDTO } from "@/lib/api-client";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
  }`;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  useEffect(() => {
    void api.getProjects().then(setProjects).catch(() => {});
    void api.getTags().then(setTags).catch(() => {});
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const activeProjects = projects.filter((p) => !p.archived);

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="text-sm font-semibold truncate">
            {user?.email}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <NavLink to="/search" className={navLinkClass}>
            <Search className="h-4 w-4" />
            Search
          </NavLink>

          <div className="pt-2" />

          <NavLink to="/inbox" className={navLinkClass}>
            <Inbox className="h-4 w-4" />
            Inbox
          </NavLink>
          <NavLink to="/today" className={navLinkClass}>
            <CalendarDays className="h-4 w-4" />
            Today
          </NavLink>
          <NavLink to="/upcoming" className={navLinkClass}>
            <CalendarRange className="h-4 w-4" />
            Upcoming
          </NavLink>

          {/* Projects section */}
          <div className="pt-4">
            <button
              onClick={() => setProjectsOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" />
                Projects
              </span>
              {projectsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {projectsOpen && (
              <div className="mt-1 space-y-0.5">
                {activeProjects.map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={navLinkClass}
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color ?? "#737373" }}
                    />
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                ))}
                <NavLink to="/projects" className={navLinkClass} end>
                  <Plus className="h-4 w-4" />
                  Manage projects
                </NavLink>
              </div>
            )}
          </div>

          {/* Tags section */}
          <div className="pt-4">
            <button
              onClick={() => setTagsOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Tags className="h-3.5 w-3.5" />
                Tags
              </span>
              {tagsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {tagsOpen && (
              <div className="mt-1 space-y-0.5">
                {tags.map((tag) => (
                  <NavLink
                    key={tag.id}
                    to={`/tags/${tag.id}`}
                    className={navLinkClass}
                  >
                    <Hash
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: tag.color ?? undefined }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </NavLink>
                ))}
                <NavLink to="/tags" className={navLinkClass} end>
                  <Plus className="h-4 w-4" />
                  Manage tags
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="border-t px-3 py-2">
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
