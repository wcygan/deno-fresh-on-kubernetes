import Link from '@docusaurus/Link';

export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Link className="button button--primary button--lg" to="/intro">
        View Documentation →
      </Link>
    </div>
  );
}