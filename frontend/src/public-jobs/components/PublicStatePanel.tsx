interface PublicStatePanelProps {
  title: string;
  description?: string;
  message?: string;
  tone?: 'neutral' | 'error' | 'success';
  actionLabel?: string;
  onAction?: () => void;
}

export function PublicStatePanel({
  title,
  description,
  message,
  tone = 'neutral',
  actionLabel,
  onAction,
}: PublicStatePanelProps) {
  const body = (description || message || '').trim();

  return (
    <div className={'pj-state-panel pj-state-panel-' + tone} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="pj-state-panel-copy">
        <strong>{title}</strong>
        {body ? <p>{body}</p> : null}
      </div>
      {actionLabel && onAction ? <button type="button" className="pj-btn pj-btn-primary" onClick={onAction}>{actionLabel}</button> : null}
    </div>
  );
}
