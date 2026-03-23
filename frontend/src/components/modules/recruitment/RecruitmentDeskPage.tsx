/**
 * Recruitment Desk Page
 *
 * Top-level container for the private Recruitment Desk module.
 * Provides tab navigation between:
 * - Candidate Pipeline (PRV-01)
 * - Job Posts (PRV-02)
 */

import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import JobPostsListView from './JobPostsListView';
import CandidatePipelineView from './CandidatePipelineView';
import { useResponsive } from '../../../hooks/useResponsive';

const { Title } = Typography;

interface Props {
    navigateToRoute: (route: string, id?: string) => void;
    initialTab?: string;
    selectedJobPostId?: string;
}

export default function RecruitmentDeskPage({ navigateToRoute, initialTab, selectedJobPostId }: Props) {
    const { isMobile } = useResponsive();
    const [activeTab, setActiveTab] = useState(initialTab || 'pipeline');

    return (
        <div style={{ padding: isMobile ? '12px 12px 0' : '16px 24px 0' }}>
            <Title level={isMobile ? 5 : 4} style={{ marginBottom: isMobile ? 6 : 8 }}>Recruitment Desk</Title>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size={isMobile ? 'small' : 'middle'}
                items={[
                    {
                        key: 'pipeline',
                        label: (
                            <span style={{ fontSize: isMobile ? 12 : 13 }}>
                                <TeamOutlined style={{ marginRight: 6 }} />
                                Candidate Pipeline
                            </span>
                        ),
                        children: <CandidatePipelineView navigateToRoute={navigateToRoute} />,
                    },
                    {
                        key: 'job-posts',
                        label: (
                            <span style={{ fontSize: isMobile ? 12 : 13 }}>
                                <FileTextOutlined style={{ marginRight: 6 }} />
                                Job Posts
                            </span>
                        ),
                        children: (
                            <JobPostsListView
                                navigateToRoute={navigateToRoute}
                                selectedJobId={selectedJobPostId}
                            />
                        ),
                    },
                ]}
                style={{ marginBottom: 0 }}
                tabBarStyle={isMobile ? { marginBottom: 8 } : undefined}
            />
        </div>
    );
}
