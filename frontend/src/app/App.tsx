import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { AppRouter } from "@/routes/AppRouter";
import { AnimatedGeometryBackground } from "@/widgets/layout/AnimatedGeometryBackground";

export function App(): JSX.Element {
  useAppBootstrap();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedGeometryBackground />
      <div className="relative z-10">
        <AppRouter />
      </div>
    </div>
  );
}
