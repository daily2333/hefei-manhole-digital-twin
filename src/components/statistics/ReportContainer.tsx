import React, { useState } from 'react';
import { Card, Tabs, DatePicker, Button, Space, Radio, Tooltip } from 'antd';
import { 
  CalendarOutlined, 
  DownloadOutlined, 
  PrinterOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { ManholeInfo } from '../../typings';
import DailyReport from '../reports/DailyReport';

const { RangePicker } = DatePicker;

interface ReportContainerProps {
  manholes: ManholeInfo[];
}

enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * 报表容器组件
 * 集成各种统计报表，包括日报表、周报表、月报表等
 */
const ReportContainer: React.FC<ReportContainerProps> = ({ manholes }) => {
  const [reportType, setReportType] = useState<ReportType>(ReportType.DAILY);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);

  // 刷新报表
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // 导出报表
  const handleExport = (type: 'excel' | 'pdf') => {
    console.log(`导出${type}格式报表`);
    // 实际导出逻辑
  };

  // 打印报表
  const handlePrint = () => {
    window.print();
  };

  // 渲染报表内容
  const renderReportContent = () => {
    switch (reportType) {
      case ReportType.DAILY:
        return <DailyReport manholes={manholes} date={selectedDate} loading={loading} />;
      case ReportType.WEEKLY:
        return <div>周报表功能开发中...</div>;
      case ReportType.MONTHLY:
        return <div>月报表功能开发中...</div>;
      default:
        return <div>未知报表类型</div>;
    }
  };

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined /> 
          统计报表
        </Space>
      }
      extra={
        <Space>
          <Radio.Group
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value={ReportType.DAILY}>日报表</Radio.Button>
            <Radio.Button value={ReportType.WEEKLY}>周报表</Radio.Button>
            <Radio.Button value={ReportType.MONTHLY}>月报表</Radio.Button>
          </Radio.Group>
          
          <DatePicker 
            onChange={(date) => date && setSelectedDate(date.toDate())}
            allowClear={false}
            format={
              reportType === ReportType.DAILY ? 'YYYY-MM-DD' :
              reportType === ReportType.WEEKLY ? 'YYYY-WW周' : 'YYYY-MM'
            }
            picker={
              reportType === ReportType.DAILY ? 'date' :
              reportType === ReportType.WEEKLY ? 'week' : 'month'
            }
          />
          
          <Tooltip title="刷新">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            />
          </Tooltip>
          
          <Tooltip title="导出Excel">
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={() => handleExport('excel')}
            />
          </Tooltip>
          
          <Tooltip title="导出PDF">
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={() => handleExport('pdf')}
            />
          </Tooltip>
          
          <Tooltip title="打印">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
            />
          </Tooltip>
        </Space>
      }
    >
      {renderReportContent()}
    </Card>
  );
};

export default ReportContainer; 