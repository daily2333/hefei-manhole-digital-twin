import React, { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Select,
  Switch,
  Slider,
  Radio,
  Space,
  Divider,
  Row,
  Col,
  Tabs,
  Typography,
  message,
  Collapse,
  InputNumber
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';

const { Option } = Select;
const { Panel } = Collapse;

// 自定义统计数据组件
interface StatisticDisplayProps {
  title: string;
  value: string | number;
}

const StatisticDisplay: React.FC<StatisticDisplayProps> = ({ title, value }) => (
  <div>
    <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)' }}>{title}</div>
    <div style={{ fontSize: '24px', color: 'rgba(0, 0, 0, 0.85)' }}>{value}</div>
  </div>
);

// 系统设置主组件
const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [maintenanceForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings } = useSettings();

  // 系统维护设置面板
  const renderSystemMaintenanceSettings = () => {
    return (
      <Card title="系统维护设置" className="settings-card">
        <Form form={maintenanceForm}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="autoBackup"
                label="自动备份"
                valuePropName="checked"
              >
                <Switch checkedChildren="开" unCheckedChildren="关" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="backupInterval"
                label="备份间隔 (小时)"
                dependencies={['autoBackup']}
              >
                {({ getFieldValue }) => (
                  <Select disabled={!getFieldValue('autoBackup')}>
                    <Option value={24}>每天</Option>
                    <Option value={168}>每周</Option>
                    <Option value={720}>每月</Option>
                  </Select>
                )}
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="logLevel"
                label="日志级别"
              >
                <Select>
                  <Option value="debug">调试</Option>
                  <Option value="info">信息</Option>
                  <Option value="warn">警告</Option>
                  <Option value="error">错误</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="dataRetentionDays"
                label="数据保留天数"
              >
                <InputNumber min={30} max={730} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Collapse ghost>
            <Panel header="系统诊断" key="1">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <StatisticDisplay title="系统运行时间" value="10 天 5 小时" />
                  </Col>
                  <Col span={8}>
                    <StatisticDisplay title="数据库大小" value="256.4 MB" />
                  </Col>
                  <Col span={8}>
                    <StatisticDisplay title="客户端版本" value="1.2.3" />
                  </Col>
                </Row>
                
                <Space>
                  <Button>清理缓存</Button>
                  <Button danger>重置应用</Button>
                  <Button type="primary">系统诊断</Button>
                </Space>
              </Space>
            </Panel>
          </Collapse>
        </Form>
      </Card>
    );
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const maintenanceValues = await maintenanceForm.validateFields();
      console.log('设置表单值:', { ...values, ...maintenanceValues });
      message.success('设置已保存');
      await updateSettings({ ...settings, ...values, ...maintenanceValues });
    } catch (error) {
      console.error('验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    form.resetFields();
    maintenanceForm.resetFields();
    message.info('设置已重置');
  };

  return (
    <div className="system-settings-container">
      <Typography.Title level={4}>系统设置</Typography.Title>
      
      <Form form={form} layout="vertical">
        <Tabs defaultActiveKey="general" items={[
          {
            key: 'general',
            label: (
              <span>
                <SettingOutlined />
                常规设置
              </span>
            ),
            children: <Card className="settings-card">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="language"
                    label="系统语言"
                  >
                    <Select defaultValue="zh_CN">
                      <Option value="zh_CN">简体中文</Option>
                      <Option value="en_US">English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="timezone"
                    label="时区设置"
                  >
                    <Select defaultValue="Asia/Shanghai">
                      <Option value="Asia/Shanghai">中国标准时间 (GMT+8)</Option>
                      <Option value="America/New_York">东部标准时间 (GMT-5)</Option>
                      <Option value="Europe/London">格林威治标准时间 (GMT+0)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dateFormat"
                    label="日期格式"
                  >
                    <Select defaultValue="YYYY-MM-DD">
                      <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                      <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="timeFormat"
                    label="时间格式"
                  >
                    <Select defaultValue="24hour">
                      <Option value="24hour">24小时制</Option>
                      <Option value="12hour">12小时制</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="notificationsEnabled"
                    label="启用通知"
                    valuePropName="checked"
                  >
                    <Switch defaultChecked checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dataRefreshInterval"
                    label="数据刷新间隔 (秒)"
                  >
                    <InputNumber min={5} max={300} defaultValue={30} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>,
          },
          {
            key: 'appearance',
            label: (
              <span>
                <EyeOutlined />
                外观设置
              </span>
            ),
            children: <Card className="settings-card">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="theme"
                    label="主题风格"
                  >
                    <Radio.Group defaultValue="light">
                      <Radio.Button value="light">浅色</Radio.Button>
                      <Radio.Button value="dark">深色</Radio.Button>
                      <Radio.Button value="system">跟随系统</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="primaryColor"
                    label="主题色"
                  >
                    <Select defaultValue="blue">
                      <Option value="blue">蓝色</Option>
                      <Option value="green">绿色</Option>
                      <Option value="purple">紫色</Option>
                      <Option value="red">红色</Option>
                      <Option value="orange">橙色</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="compactMode"
                    label="紧凑模式"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="animationsEnabled"
                    label="启用动画效果"
                    valuePropName="checked"
                  >
                    <Switch defaultChecked checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Typography.Title level={5}>3D可视化设置</Typography.Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="graphicsQuality"
                    label="图形质量"
                  >
                    <Radio.Group defaultValue="medium">
                      <Radio.Button value="low">低</Radio.Button>
                      <Radio.Button value="medium">中</Radio.Button>
                      <Radio.Button value="high">高</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="showFps"
                    label="显示FPS"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    name="renderDistance"
                    label="渲染距离"
                  >
                    <Slider
                      marks={{
                        0: '近',
                        50: '中',
                        100: '远'
                      }}
                      defaultValue={50}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>,
          },
          {
            key: 'maintenance',
            label: (
              <span>
                <DesktopOutlined />
                系统维护
              </span>
            ),
            children: renderSystemMaintenanceSettings(),
          }
        ]} />
        
        <Divider />
        
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
            <Button 
              type="primary" 
              onClick={handleSave} 
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存设置
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default SystemSettings; 
