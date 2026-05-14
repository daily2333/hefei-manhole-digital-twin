import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { Empty, Spin } from 'antd';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

export interface ChartData {
  title?: string;
  xAxis?: string[];
  legend?: string[];
  series?: any[];
  points?: any[];
  [key: string]: any;
}

export interface ChartProps {
  type: ChartType;
  data: ChartData;
  height?: number | string;
  width?: string;
  loading?: boolean;
  options?: any;
  style?: React.CSSProperties;
  className?: string;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  height = 300,
  width = '100%',
  loading = false,
  options = {},
  style,
  className,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 格式化处理数据
  const processData = (type: ChartType, data: ChartData) => {
    const baseOptions = {
      title: {
        text: data.title || '',
        left: 'center',
        textStyle: {
          color: 'rgba(255, 255, 255, 0.85)',
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: 'rgba(255, 255, 255, 0.5)',
          }
        }
      },
      legend: {
        data: data.legend || [],
        bottom: 10,
        textStyle: {
          color: 'rgba(255, 255, 255, 0.85)',
        }
      },
      toolbox: {
        feature: {
          saveAsImage: { show: true }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'],
      backgroundColor: 'rgba(13, 28, 50, 0.0)',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.85)'
      }
    };

    switch (type) {
      case 'line': {
        const xData = data.xAxis || (data.points && data.points.length > 0 
          ? data.points.map(p => p.date || p.timestamp || p.x || '') 
          : []);
        
        const seriesData = data.series || [];
        
        // 如果没有提供series但有points，尝试从points构建series
        if (seriesData.length === 0 && data.points && data.points.length > 0) {
          if (data.points[0].value !== undefined) {
            // 单数据系列情况
            seriesData.push({
              name: data.title || '数据',
              type: 'line',
              data: data.points.map(p => p.value),
              smooth: true,
              showSymbol: true,
              areaStyle: {
                opacity: 0.2
              }
            });
          } else {
            // 多数据系列情况，需要动态提取所有字段
            const samplePoint = data.points[0];
            const fields = Object.keys(samplePoint).filter(
              key => !['date', 'timestamp', 'x', 'id', 'name'].includes(key)
            );
            
            fields.forEach(field => {
              seriesData.push({
                name: field,
                type: 'line',
                data: data.points?.map(p => p[field]) || [],
                smooth: true,
                showSymbol: true,
                areaStyle: {
                  opacity: 0.2
                }
              });
            });
          }
        }

        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: xData,
            axisTick: {
              alignWithLabel: true
            },
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)'
            }
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          series: seriesData
        };
      }
      
      case 'bar': {
        const xData = data.xAxis || (data.points && data.points.length > 0 
          ? data.points.map(p => p.name || p.category || p.x || '') 
          : []);
        
        const seriesData = data.series || [];
        
        // 如果没有提供series但有points，尝试从points构建series
        if (seriesData.length === 0 && data.points && data.points.length > 0) {
          if (data.points[0].value !== undefined) {
            // 单数据系列情况
            seriesData.push({
              name: data.title || '数据',
              type: 'bar',
              data: data.points.map(p => p.value),
              barWidth: '40%',
              itemStyle: {
                borderRadius: [4, 4, 0, 0]
              }
            });
          } else {
            // 多数据系列情况，需要动态提取所有字段
            const samplePoint = data.points[0];
            const fields = Object.keys(samplePoint).filter(
              key => !['name', 'category', 'x', 'id', 'date', 'timestamp'].includes(key)
            );
            
            fields.forEach(field => {
              seriesData.push({
                name: field,
                type: 'bar',
                data: data.points?.map(p => p[field]) || [],
                barWidth: seriesData.length === 0 ? '40%' : undefined,
                itemStyle: {
                  borderRadius: [4, 4, 0, 0]
                }
              });
            });
          }
        }

        return {
          ...baseOptions,
          xAxis: {
            type: 'category',
            data: xData,
            axisTick: {
              alignWithLabel: true
            },
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)',
              rotate: seriesData.length > 1 ? 45 : 0
            }
          },
          yAxis: {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          series: seriesData
        };
      }
      
      case 'pie': {
        const seriesData = data.series || [];
        
        // 如果没有提供series但有points，尝试从points构建series
        if (seriesData.length === 0 && data.points && data.points.length > 0) {
          const pieData = data.points.map(p => ({
            name: p.name || p.category || 'unknown',
            value: p.value || 0
          }));
          
          seriesData.push({
            name: data.title || '数据',
            type: 'pie',
            radius: '60%',
            center: ['50%', '50%'],
            data: pieData,
            itemStyle: {
              borderRadius: 5,
              borderWidth: 2,
              borderColor: 'rgba(13, 28, 50, 0.6)'
            },
            label: {
              color: 'rgba(255, 255, 255, 0.85)',
              formatter: '{b}: {c} ({d}%)'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          });
        }

        return {
          ...baseOptions,
          series: seriesData
        };
      }
      
      case 'scatter': {
        const seriesData = data.series || [];
        
        // 如果没有提供series但有points，尝试从points构建series
        if (seriesData.length === 0 && data.points && data.points.length > 0) {
          if (data.points[0].x !== undefined && data.points[0].y !== undefined) {
            // 基本散点图
            seriesData.push({
              name: data.title || '数据',
              type: 'scatter',
              data: data.points.map(p => [p.x, p.y]),
              symbolSize: 10,
            });
          }
        }

        return {
          ...baseOptions,
          xAxis: {
            type: 'value',
            scale: true,
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          yAxis: {
            type: 'value',
            scale: true,
            axisLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            },
            axisLabel: {
              color: 'rgba(255, 255, 255, 0.85)'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          series: seriesData
        };
      }
      
      default:
        return baseOptions;
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    const mergedOptions = {
      ...processData(type, data),
      ...options
    };
    
    chartInstance.current.setOption(mergedOptions, true);
    
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [type, data, options]);

  // 没有数据时显示Empty组件
  if (!data || (data.points && data.points.length === 0) && (!data.series || data.series.length === 0)) {
    return <Empty description="暂无数据" style={{ height, width }} />;
  }

  return (
    <Spin spinning={loading}>
      <div
        ref={chartRef}
        style={{ height, width, ...style }}
        className={className}
      />
    </Spin>
  );
};

export default Chart; 