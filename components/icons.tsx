// The app's icon set (Phosphor, regular weight). Components import from here, never from an icon package,
// so the set can change in one place. SSR build: works in server and client components.
import type { IconProps } from "@phosphor-icons/react/dist/lib/types";
import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  ArrowSquareOutIcon,
  BarbellIcon,
  BookmarkSimpleIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CaretDownIcon,
  CaretRightIcon,
  CaretUpIcon,
  ChatCircleDotsIcon,
  ChatTextIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleDashedIcon,
  CircleIcon,
  CircleNotchIcon,
  CodeIcon,
  EyeSlashIcon,
  FileIcon,
  FolderIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  GraduationCapIcon,
  HeartIcon,
  HouseIcon,
  LightbulbIcon,
  ListIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MinusIcon,
  NotePencilIcon,
  PaperPlaneRightIcon,
  PaperPlaneTiltIcon,
  PathIcon,
  PlayIcon,
  RecordIcon,
  RobotIcon,
  RocketIcon,
  SignOutIcon,
  StarIcon,
  TargetIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UserCircleIcon,
  UsersIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";

export type AppIcon = React.ComponentType<IconProps>;

export const AlertTriangle = WarningIcon;
export const ArrowLeft = ArrowLeftIcon;
export const ArrowRight = ArrowRightIcon;
export const BookOpen = BookOpenIcon;
export const Bookmark = BookmarkSimpleIcon;
export const BookmarkCheck = (p: IconProps) => <BookmarkSimpleIcon weight="fill" {...p} />;
export const Bot = RobotIcon;
export const Briefcase = BriefcaseIcon;
export const Check = CheckIcon;
export const CheckCircle2 = CheckCircleIcon;
export const ChevronDown = CaretDownIcon;
export const ChevronRight = CaretRightIcon;
export const ChevronUp = CaretUpIcon;
export const Circle = CircleIcon;
export const CircleDashed = CircleDashedIcon;
export const CircleDot = RecordIcon;
export const Code = CodeIcon;
export const ExternalLink = ArrowSquareOutIcon;
export const EyeOff = EyeSlashIcon;
export const File = FileIcon;
export const FolderGit2 = FolderIcon;
export const GitBranch = GitBranchIcon;
export const GitPullRequest = GitPullRequestIcon;
export const GraduationCap = GraduationCapIcon;
export const Heart = HeartIcon;
export const Home = HouseIcon;
export const Lightbulb = LightbulbIcon;
export const Loader2 = CircleNotchIcon;
export const LogOut = SignOutIcon;
export const MapPin = MapPinIcon;
export const Mentor = ChatCircleDotsIcon;
export const Menu = ListIcon;
export const MessageSquare = ChatTextIcon;
export const Minus = MinusIcon;
export const PenSquare = NotePencilIcon;
export const Play = PlayIcon;
export const Practice = BarbellIcon;
export const RefreshCw = ArrowsClockwiseIcon;
export const Rocket = RocketIcon;
export const Route = PathIcon;
export const Search = MagnifyingGlassIcon;
export const Send = PaperPlaneTiltIcon;
export const SendHorizontal = PaperPlaneRightIcon;
export const Star = StarIcon;
export const Target = TargetIcon;
export const ThumbsDown = ThumbsDownIcon;
export const ThumbsUp = ThumbsUpIcon;
export const Trash2 = TrashIcon;
export const TrendingDown = TrendDownIcon;
export const TrendingUp = TrendUpIcon;
export const Undo2 = ArrowCounterClockwiseIcon;
export const User = UserCircleIcon;
export const Users = UsersIcon;
export const X = XIcon;
export const XCircle = XCircleIcon;
