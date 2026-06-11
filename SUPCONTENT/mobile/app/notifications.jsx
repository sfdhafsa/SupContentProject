import PlaceholderScreen from '../src/components/PlaceholderScreen';
import RequireAuth from '../src/components/RequireAuth';

export default function Notifications() {
  return (
    <RequireAuth>
      <PlaceholderScreen title="Alertes" />
    </RequireAuth>
  );
}
