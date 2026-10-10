import { Link } from "./components/Link";
import { MaterialsGate } from "./components/Paywall";
import { usePathname } from "./lib/router";
import { AboutFspPage } from "./pages/AboutFsp";
import { AdminPage } from "./pages/Admin";
import { ArztbriefListPage, ArztbriefPage } from "./pages/Arztbrief";
import { AufklaerungListPage, AufklaerungPage } from "./pages/Aufklaerung";
import { CaseDetailPage } from "./pages/CaseDetail";
import { CasesPage } from "./pages/Cases";
import { DashboardPage } from "./pages/Dashboard";
import { ExamPage } from "./pages/Exam";
import { FachsprachePage } from "./pages/Fachsprache";
import { HomePage } from "./pages/Home";
import { StartPage } from "./pages/Start";
import { TodayPage } from "./pages/Today";
import { HoerenListPage, HoerenPage } from "./pages/Hoeren";
import { LoginPage } from "./pages/Login";
import { ProPage } from "./pages/Pro";
import { FeedbackPage } from "./pages/Feedback";
import { RedemittelPage } from "./pages/Redemittel";
import { SimulationPage } from "./pages/Simulation";
import { WordsPage } from "./pages/Words";
import { tr } from "./lib/i18n";

function NotFoundPage() {
  return (
    <div className="page flex flex-col items-center py-24 text-center">
      <p className="text-5xl font-bold text-teal-600">404</p>
      <h1 className="mt-3 text-xl font-semibold">
        {tr("Sahifa topilmadi", "Страница не найдена", "Sayfa bulunamadı", "Page not found")}
      </h1>
      <Link href="/" className="btn-primary mt-6">
        {tr("Bosh sahifaga", "На главную", "Ana sayfaya", "To the home page")}
      </Link>
    </div>
  );
}

const ROUTES = [
  [/^\/$/, HomePage],
  [/^\/fsp$/, AboutFspPage],
  [/^\/start$/, StartPage],
  [/^\/bugun$/, TodayPage],
  [/^\/login$/, LoginPage],
  [/^\/dashboard$/, DashboardPage],
  [/^\/faelle$/, CasesPage],
  [/^\/faelle\/[^/]+$/, CaseDetailPage],
  [/^\/simulation$/, SimulationPage],
  [/^\/arztbrief$/, ArztbriefListPage],
  [/^\/arztbrief\/[^/]+$/, ArztbriefPage],
  [/^\/aufklaerung$/, AufklaerungListPage],
  [/^\/aufklaerung\/[^/]+$/, AufklaerungPage],
  [/^\/woerter$/, WordsPage],
  [/^\/fachsprache$/, FachsprachePage],
  [/^\/redemittel$/, RedemittelPage],
  [/^\/hoeren$/, HoerenListPage],
  [/^\/hoeren\/[^/]+$/, HoerenPage],
  [/^\/pro$/, ProPage],
  [/^\/fikr$/, FeedbackPage],
  [/^\/pruefung$/, ExamPage],
  [/^\/admin$/, AdminPage],
];

const MATERIALS =
  /^\/(faelle|simulation|arztbrief|aufklaerung|hoeren|woerter|fachsprache|redemittel|bugun|pruefung)(\/|$)/;

export function Router() {
  const pathname = usePathname();
  const Page = ROUTES.find(([re]) => re.test(pathname))?.[1] ?? NotFoundPage;
  // O‘quv materiallari: akkaunt + 1 kunlik bepul sinov yoki faol tarif (materiallar serverdan keladi)
  if (MATERIALS.test(pathname))
    return (
      <MaterialsGate>
        <Page key={pathname} />
      </MaterialsGate>
    );
  return <Page key={pathname} />;
}
