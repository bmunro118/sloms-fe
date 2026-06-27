import { ScrollView } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { TimeseriesPanel } from '@src/features/stats/components/TimeseriesPanel';
import { StatBuilderPanel } from '@src/features/stats/components/StatBuilderPanel';

export default function StatsScreen() {
  useScreenTitle('Statistics');

  return (
    <ScrollView>
      <ScreenContent gap={16}>
        <ThemedCard title="Revenue Graphs">
          <TimeseriesPanel />
        </ThemedCard>
        <ThemedCard title="Stat Builder">
          <StatBuilderPanel />
        </ThemedCard>
      </ScreenContent>
    </ScrollView>
  );
}
