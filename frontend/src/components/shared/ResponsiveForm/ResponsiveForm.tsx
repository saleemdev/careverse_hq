/**
 * ResponsiveForm Component
 * Provides automatic layout switching for forms based on device size
 */

import { Form, FormProps } from 'antd';
import { FormItemProps } from 'antd/lib/form';
import { useResponsive } from '../../../hooks/useResponsive';

export const ResponsiveForm: React.FC<FormProps> = ({
  children,
  layout,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <Form
      layout={layout || (isMobile ? 'vertical' : 'horizontal')}
      labelCol={!isMobile && !layout ? { span: 6 } : undefined}
      wrapperCol={!isMobile && !layout ? { span: 18 } : undefined}
      {...props}
    >
      {children}
    </Form>
  );
};

export const ResponsiveFormItem: React.FC<FormItemProps> = ({
  children,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <Form.Item
      {...props}
      labelCol={!isMobile && !props.labelCol ? { span: 6 } : props.labelCol}
      wrapperCol={!isMobile && !props.wrapperCol ? { span: 18 } : props.wrapperCol}
    >
      {children}
    </Form.Item>
  );
};

export default ResponsiveForm;
