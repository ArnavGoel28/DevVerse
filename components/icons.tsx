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
  ChatCircleIcon,
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
  HandsClappingIcon,
  HeartIcon,
  HouseIcon,
  LightbulbIcon,
  LinkSimpleIcon,
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

/** Icons are decorative (aria-hidden) unless given an aria-label (web interface guidelines). */
function decorative(Icon: AppIcon): AppIcon {
  function A11yIcon(p: IconProps) {
    return <Icon aria-hidden={p["aria-label"] ? undefined : true} {...p} />;
  }
  return A11yIcon;
}

export const AlertTriangle = decorative(WarningIcon);
export const ArrowLeft = decorative(ArrowLeftIcon);
export const ArrowRight = decorative(ArrowRightIcon);
export const BookOpen = decorative(BookOpenIcon);
export const Bookmark = decorative(BookmarkSimpleIcon);
export const BookmarkCheck = decorative((p: IconProps) => <BookmarkSimpleIcon weight="fill" {...p} />);
export const Bot = decorative(RobotIcon);
export const Briefcase = decorative(BriefcaseIcon);
export const Check = decorative(CheckIcon);
export const CheckCircle2 = decorative(CheckCircleIcon);
export const Clap = decorative(HandsClappingIcon);
export const Comment = decorative(ChatCircleIcon);
export const ChevronDown = decorative(CaretDownIcon);
export const ChevronRight = decorative(CaretRightIcon);
export const ChevronUp = decorative(CaretUpIcon);
export const Circle = decorative(CircleIcon);
export const CircleDashed = decorative(CircleDashedIcon);
export const CircleDot = decorative(RecordIcon);
export const Code = decorative(CodeIcon);
export const ExternalLink = decorative(ArrowSquareOutIcon);
export const EyeOff = decorative(EyeSlashIcon);
export const File = decorative(FileIcon);
export const FolderGit2 = decorative(FolderIcon);
export const GitBranch = decorative(GitBranchIcon);
export const GitPullRequest = decorative(GitPullRequestIcon);
export const GraduationCap = decorative(GraduationCapIcon);
export const Heart = decorative(HeartIcon);
export const Home = decorative(HouseIcon);
export const Lightbulb = decorative(LightbulbIcon);
export const LinkIcon = decorative(LinkSimpleIcon);
export const Loader2 = decorative(CircleNotchIcon);
export const LogOut = decorative(SignOutIcon);
export const MapPin = decorative(MapPinIcon);
export const Mentor = decorative(ChatCircleDotsIcon);
export const Menu = decorative(ListIcon);
export const MessageSquare = decorative(ChatTextIcon);
export const Minus = decorative(MinusIcon);
export const PenSquare = decorative(NotePencilIcon);
export const Play = decorative(PlayIcon);
export const Practice = decorative(BarbellIcon);
export const RefreshCw = decorative(ArrowsClockwiseIcon);
export const Rocket = decorative(RocketIcon);
export const Route = decorative(PathIcon);
export const Search = decorative(MagnifyingGlassIcon);
export const Send = decorative(PaperPlaneTiltIcon);
export const SendHorizontal = decorative(PaperPlaneRightIcon);
export const Star = decorative(StarIcon);
export const Target = decorative(TargetIcon);
export const ThumbsDown = decorative(ThumbsDownIcon);
export const ThumbsUp = decorative(ThumbsUpIcon);
export const Trash2 = decorative(TrashIcon);
export const TrendingDown = decorative(TrendDownIcon);
export const TrendingUp = decorative(TrendUpIcon);
export const Undo2 = decorative(ArrowCounterClockwiseIcon);
export const User = decorative(UserCircleIcon);
export const Users = decorative(UsersIcon);
export const X = decorative(XIcon);
export const XCircle = decorative(XCircleIcon);
