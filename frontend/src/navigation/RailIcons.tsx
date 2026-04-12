import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';
import {
    AccountSetting02Icon,
    Agreement02Icon,
    ArrowDataTransferHorizontalIcon,
    Building04Icon,
    Calendar03Icon,
    Clock02Icon,
    Configuration02Icon,
    DashboardSpeed02Icon,
    DashboardSquare02Icon,
    FileSearchIcon,
    Home09Icon,
    Key01Icon,
    LicenseIcon,
    Link04Icon,
    Package01Icon,
    SecurityCheckIcon,
    UserGroup03Icon,
    UserSettings01Icon,
    Upload04Icon,
    WorkflowSquare05Icon,
    Profile02Icon,
} from '@hugeicons/core-free-icons';

type RailIconProps = Omit<HugeiconsIconProps, 'icon' | 'altIcon' | 'color'> & {
    size?: number | string;
    strokeWidth?: number;
};

const withRailDefaults = (
    icon: IconSvgElement,
    {
        size = 20,
        strokeWidth = 1.7,
    }: Pick<RailIconProps, 'size' | 'strokeWidth'> = {},
) => {
    const RailIcon = ({
        size: overrideSize = size,
        strokeWidth: overrideStrokeWidth = strokeWidth,
        ...props
    }: RailIconProps) => (
        <HugeiconsIcon
            icon={icon}
            size={overrideSize}
            strokeWidth={overrideStrokeWidth}
            color="currentColor"
            absoluteStrokeWidth
            {...props}
        />
    );

    return RailIcon;
};

export const BrandShieldRailIcon = withRailDefaults(SecurityCheckIcon, { size: 18, strokeWidth: 1.75 });
export const HomeRailIcon = withRailDefaults(Home09Icon, { size: 22 });
export const WorkforceRailIcon = withRailDefaults(UserGroup03Icon, { size: 22 });
export const OperationsRailIcon = withRailDefaults(WorkflowSquare05Icon, { size: 22 });
export const ShieldRailIcon = withRailDefaults(SecurityCheckIcon, { size: 22 });
export const SettingsRailIcon = withRailDefaults(Configuration02Icon, { size: 22 });

export const GaugeRailIcon = withRailDefaults(DashboardSpeed02Icon, { size: 18 });
export const UsersRailIcon = withRailDefaults(UserSettings01Icon, { size: 18 });
export const BuildingRailIcon = withRailDefaults(Building04Icon, { size: 18 });
export const LinkRailIcon = withRailDefaults(Link04Icon, { size: 18 });
export const UploadRailIcon = withRailDefaults(Upload04Icon, { size: 18 });
export const CalendarRailIcon = withRailDefaults(Calendar03Icon, { size: 18 });
export const ClockRailIcon = withRailDefaults(Clock02Icon, { size: 18 });
export const ArchiveRailIcon = withRailDefaults(Package01Icon, { size: 18 });
export const UserSearchRailIcon = withRailDefaults(UserGroup03Icon, { size: 18 });
export const FileSearchRailIcon = withRailDefaults(FileSearchIcon, { size: 18 });
export const ContractRailIcon = withRailDefaults(Agreement02Icon, { size: 18 });
export const KeyRailIcon = withRailDefaults(Key01Icon, { size: 18 });
export const ProfileRailIcon = withRailDefaults(Profile02Icon, { size: 18 });
export const SwapRailIcon = withRailDefaults(ArrowDataTransferHorizontalIcon, { size: 18 });

export const DashboardGroupRailIcon = withRailDefaults(DashboardSquare02Icon, { size: 22 });
export const AccountRailIcon = withRailDefaults(AccountSetting02Icon, { size: 18 });
export const LicenseRailIcon = withRailDefaults(LicenseIcon, { size: 18 });
