import type { PublicJobsBoot } from '../types';

interface Props {
  boot: PublicJobsBoot;
}

export function PublicFooter({ boot }: Props) {
  return (
    <footer className="pj-footer">
      <div className="pj-shell pj-footer-inner">
        <p className="pj-footer-copy">© {boot.currentYear} {boot.appName}. All rights reserved.</p>
        <div className="pj-footer-links">
          <a href="/jobs">Jobs Board</a>
          {boot.hasAdminAccess ? <a href={boot.adminCentralLink}>Admin Central</a> : null}
          <a href="/login">Sign In</a>
        </div>
      </div>
    </footer>
  );
}
