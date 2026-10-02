import { Link } from "./components/Link";
import { usePathname } from "./lib/router";
import { AboutFspPage } from "./pages/AboutFsp";
import { AdminPage } from "./pages/Admin";
import { ArztbriefListPage, ArztbriefPage } from "./pages/Arztbrief";
import { CaseDetailPage } from "./pages/CaseDetail";
import { CasesPage } from "./pages/Cases";
import { DashboardPage } from "./pages/Dashboard";
import { ExamPage } from "./pages/Exam";
import { FachsprachePage } from "./pages/Fachsprache";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { RedemittelPage } from "./pages/Redemittel";
import { SimulationPage } from "./pages/Simulation";
import { WordsPage } from "./pages/Words";

function NotFoundPage() {
  return (
    <div className="page flex flex-col items-center py-24 text-center">
      <p className="text-5xl font-bold text-teal-600">404</p>
      <h1 className="mt-3 text-xl font-semibold">Sahifa topilmadi</h1>
      <Link href="/" className="btn-primary mt-6">
        Bosh sahifaga
      </Link>
    </div>
  );
}

const ROUTES = [
  [/^\/$/, HomePage],
  [/^\/fsp$/, AboutFspPage],
  [/^\/login$/, LoginPage],
  [/^\/dashboard$/, DashboardPage],
  [/^\/faelle$/, CasesPage],
  [/^\/faelle\/[^/]+$/, CaseDetailPage],
  [/^\/simulation$/, SimulationPage],
  [/^\/arztbrief$/, ArztbriefListPage],
  [/^\/arztbrief\/[^/]+$/, ArztbriefPage],
  [/^\/woerter$/, WordsPage],
  [/^\/fachsprache$/, FachsprachePage],
  [/^\/redemittel$/, RedemittelPage],
  [/^\/pruefung$/, ExamPage],
  [/^\/admin$/, AdminPage],
];

export function Router() {
  const pathname = usePathname();
  const Page = ROUTES.find(([re]) => re.test(pathname))?.[1] ?? NotFoundPage;
  return <Page key={pathname} />;
}
