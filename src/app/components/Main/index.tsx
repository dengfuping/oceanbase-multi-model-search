'use client';
import React, { useRef, useState } from 'react';
import { Button, Card, Collapse, ConfigProvider, Popover, Space, theme } from '@oceanbase/design';
import { CheckCircleFilled, RightOutlined } from '@ant-design/icons';
import {
  ChatMessage as ProChatMessage,
  ProChat,
  ProChatProvider,
  useProChat,
} from '@ant-design/pro-chat';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
// import defaultStyle from 'react-syntax-highlighter/dist/esm/styles/hljs/default-style';
import { isEmpty, min, range, sample } from 'lodash-es';
import { format } from 'sql-formatter';
import { useSize } from 'ahooks';
import MapContainer from '../MapContainer';
import './index.css';

// SyntaxHighlighter.registerLanguage('sql', sql);

function jsonParse(jsonStr: string, defaultValue: any): any {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return defaultValue;
  }
}

export interface ChatMessage extends ProChatMessage<Record<string, any>> {
  sql?: string;
  datas?: string;
  collapsed?: boolean;
}

export interface PayloadMessage {
  role?: string;
  content?: string;
}

export interface Payload {
  messages?: PayloadMessage[];
  new_input?: string;
  departure?: string;
  distance?: string;
  season?: string;
  score?: number;
}
export interface DataItem {
  attraction_name?: string;
  address_text?: string;
  intro?: string;
  score?: number;
  season?: number;
  ticket?: string;
  'st_astext(address)': 'POINT(30.255306 120.14898)';
}

export interface Meta {
  reply?: string;
  need_reset?: boolean;
  sql?: string;
  datas?: DataItem[];
  longs?: number[];
  lats?: number[];
  departure?: string;
  distance?: string;
  season?: string;
  score?: number;
}

const Main = () => {
  const { token } = theme.useToken();
  const [alertCollapsed, setAlertCollapsed] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const alertSize = useSize(alertRef);
  const footerRef = useRef<HTMLDivElement>(null);
  const footerSize = useSize(footerRef);
  // judge for meta.need_start
  const [resetMessageId, setResetMessageId] = useState('');
  const [loading, setLoading] = useState(false);
  const proChat = useProChat();
  const tipList = [
    '春天去杭州，西湖附近10公里内评分超过90的免费景点推荐',
    '秋天去北京，在颐和园附近20公里范围内评分超过80分的景点有哪些',
    '冬天去大连，星海广场附近20公里范围内评分超过80分的免费景点推荐',
    '夏天去成都，太古里附近10公里内评分超过90的收费景点推荐',
  ];
  const [meta, setMeta] = useState<Meta | undefined>(undefined);
  const positionList =
    meta?.longs?.map((item, index) => [item, meta.lats?.[index] as number]) || [];

  return (
    <div className="multi-model-demo-container">
      <div className="left">
        <Collapse
          ref={alertRef}
          className="alert"
          bordered={false}
          expandIconPosition="end"
          expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? -90 : 90} />}
          items={[
            {
              key: 'alert',
              label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src="/image/star.svg" />
                  <span className="title">说明</span>
                  <span className="description">AI 助手依赖 4 项必要信息为您查询景点</span>
                </div>
              ),
              children: (
                <Space size={20} direction="vertical" className="content">
                  <div className="content-item">
                    ① 旅行起始地、② 行程范围
                    <img src="/image/arrow.svg" className="arrow" />
                    <Space size={16} className="query-type">
                      <img src="/image/gis.svg" />
                      GIS 查询
                    </Space>
                  </div>
                  <div className="content-item">
                    ③ 景点评分、④ 出行季节
                    <img src="/image/arrow.svg" className="arrow" />
                    <Space size={16} className="query-type">
                      <img src="/image/relation.svg" />
                      关系数据查询
                    </Space>
                  </div>
                  <div className="content-item">
                    ⑤ (非必要) 景色类型、饮食风味等
                    <img src="/image/arrow.svg" className="arrow" />
                    <Space size={16} className="query-type">
                      <img src="/image/vector.svg" />
                      向量查询
                    </Space>
                  </div>
                </Space>
              ),
              style: {
                padding: 0,
              },
              styles: {
                header: {
                  height: 37,
                  lineHeight: '37px',
                  padding: '0 16px 0 24px',
                  borderRadius: 0,
                  fontSize: 15,
                  background: '#086fff14',
                  display: 'flex',
                  alignItems: 'center',
                },
                body: {
                  padding: 0,
                },
              },
            },
          ]}
        />
        <div
          className="chat"
          style={{
            height: `calc(100% - ${alertSize?.height || 0}px - ${24 * 3}px)`,
          }}
        >
          <ProChat
            appStyle={{
              height: `calc(100% - ${footerSize?.height || 0}px)`,
            }}
            // onChatEnd not work for now
            // issue https://github.com/ant-design/pro-chat/issues/305
            onChatEnd={() => {
              proChat.scrollToBottom?.();
            }}
            // onChatEnd seems not work
            onResetMessage={async () => {
              setMeta({});
            }}
            inputAreaProps={{
              placeholder: '请输入您的问题',
            }}
            inputAreaRender={(defaultDom, onMessageSend, onClearAllHistory) => {
              return (
                <div
                  style={{ height: 64, marginBottom: 12, display: 'flex', alignItems: 'center' }}
                >
                  <div style={{ flex: 1 }}>{defaultDom}</div>
                  <Popover
                    content={
                      !loading && (
                        <Space size={8} direction="vertical">
                          {tipList.map((item) => (
                            <div
                              key={item}
                              className="chat-tip-item"
                              onClick={() => {
                                proChat.sendMessage(item);
                              }}
                            >
                              {item}
                            </div>
                          ))}
                        </Space>
                      )
                    }
                  >
                    <Button
                      disabled={loading}
                      // onClick={() => {
                      //   const randomTipIndex = sample(range(0, tipList.length));
                      //   onMessageSend(tipList[randomTipIndex || 0]);
                      // }}
                      style={{
                        height: 44,
                        marginBottom: -8,
                        marginRight: 16,
                      }}
                    >
                      快速提问
                    </Button>
                  </Popover>
                </div>
              );
            }}
            assistantMeta={{
              avatar: '/image/bot.svg',
            }}
            helloMessage={
              <div>
                <div style={{ lineHeight: '24px' }}>
                  您好，我是 OceanBase
                  研发的文旅小助手，可以根据您提供的：1.旅行起始地（请尽量包含省市区街道等层级区划信息以确保定位准确）；2.行程范围；3.景点评分（100分制）；4.出行季节，为您推荐景点
                </div>
                <Space size={8} direction="vertical" className="chat-tip">
                  <div className="chat-tip-text">您可以试着问我</div>
                  {tipList.map((item) => (
                    <div
                      key={item}
                      className="chat-tip-item"
                      onClick={() => {
                        proChat.sendMessage(item);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </Space>
              </div>
            }
            actions={{
              render: (defaultDoms) => {
                if (proChat.getChatMessages().length > 0) {
                  return defaultDoms;
                }
                return [];
              },
            }}
            chatItemRenderConfig={{
              contentRender: (props, defaultDom) => {
                const chatMessage = props.originData as ChatMessage;
                return chatMessage.sql ? (
                  <div style={{ width: '100%' }}>
                    <Card bodyStyle={{ padding: 0 }}>
                      <Collapse
                        ghost={true}
                        expandIconPosition="end"
                        expandIcon={({ isActive }) => (
                          <RightOutlined rotate={isActive ? -90 : 90} />
                        )}
                        onChange={(activeKeys) => {
                          // @ts-ignore
                          proChat.setChat(chatMessage.id, {
                            ...chatMessage,
                            collapsed: activeKeys.length === 0,
                          });
                        }}
                        items={[
                          {
                            key: chatMessage.id,
                            label: chatMessage.collapsed ? '收起运行过程' : '查看运行过程',
                            children: (
                              <Space direction="vertical" style={{ width: '100%', fontSize: 14 }}>
                                <Space>
                                  <CheckCircleFilled
                                    style={{ display: 'block', color: token.colorSuccess }}
                                  />
                                  执行 SQL 查询
                                </Space>
                                <SyntaxHighlighter
                                  language="sql"
                                  customStyle={{
                                    margin: 0,
                                    padding: 16,
                                    background: token.colorFillQuaternary,
                                    borderRadius: token.borderRadiusSM,
                                  }}
                                >
                                  {format(chatMessage.sql || '', {
                                    language: 'mysql',
                                  })}
                                </SyntaxHighlighter>
                                <Space style={{ marginTop: 8 }}>
                                  <CheckCircleFilled
                                    style={{ display: 'block', color: token.colorSuccess }}
                                  />
                                  生成景点推荐
                                </Space>
                              </Space>
                            ),
                            style: {
                              padding: 0,
                            },
                            styles: {
                              body: {
                                paddingTop: 4,
                              },
                            },
                          },
                        ]}
                      />
                    </Card>
                    {(meta?.datas?.length || 0) > 0 ? (
                      <Card
                        style={{ marginTop: 8 }}
                        bodyStyle={{ paddingTop: 16, paddingBottom: 0 }}
                      >
                        <div>根据您的诉求查询到以下结果：</div>
                        <Collapse
                          bordered={false}
                          expandIconPosition="end"
                          expandIcon={({ isActive }) => (
                            <RightOutlined rotate={isActive ? -90 : 90} />
                          )}
                          items={meta?.datas?.map((item, index) => {
                            const ticketParsed = jsonParse(
                              item.ticket?.replaceAll('\\n', '')?.replaceAll("'", '"') || '',
                              {},
                            ) as { [key: string]: string[] };
                            const minTicketParsed = min(
                              Object.values(ticketParsed).map((value) => {
                                try {
                                  return parseFloat(value?.[0]?.replace(/[^\d.]/g, ''));
                                } catch (err) {
                                  console.error(err);
                                }
                              }),
                            );
                            return {
                              key: item.attraction_name,
                              label: (
                                <div>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {`${index + 1}. ${item.attraction_name}`}
                                  </div>
                                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                    <Space size={12} style={{ margin: '4px 0px' }}>
                                      <span style={{ color: token.colorError }}>
                                        {`${item.score}分`}
                                      </span>
                                      <span>{`季节：${item.season}`}</span>
                                      <span>
                                        {`价格：${
                                          isEmpty(ticketParsed)
                                            ? item.ticket || '免费'
                                            : `¥${minTicketParsed}起`
                                        }`}
                                      </span>
                                    </Space>
                                    <div>{item.address_text?.replaceAll('\n\n', ' ')}</div>
                                  </div>
                                </div>
                              ),
                              children: (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                    padding: 16,
                                    background: token.colorFillQuaternary,
                                    borderRadius: token.borderRadiusSM,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  <div>
                                    {`价格：${item.ticket?.replaceAll('\\n', '') || '免费'}\n`}
                                  </div>
                                  <div>{item.address_text?.replaceAll('\n\n', '\n')}</div>
                                </div>
                              ),
                              style: {
                                padding: 0,
                                background: token.colorBgContainer,
                                borderColor: '#e2e8f3d9',
                              },
                              styles: {
                                header: {
                                  padding: '16px 0px',
                                },
                                body: {
                                  padding: '0px 0px 16px 0px',
                                },
                              },
                            };
                          })}
                        />
                      </Card>
                    ) : (
                      <Card style={{ marginTop: 8 }} bodyStyle={{ padding: '12px 16px' }}>
                        很遗憾，没有查询到符合您诉求的旅游景点，可以尝试扩大行程范围或调整景点评分。
                      </Card>
                    )}
                  </div>
                ) : (
                  defaultDom
                );
              },
              actionsRender: () => <div />,
            }}
            request={async (originMessages) => {
              setLoading(true);
              const resetMessageIndex = originMessages.findIndex(
                (item) => item.id === resetMessageId,
              );
              const messages = originMessages
                .filter((item, index) => index > resetMessageIndex)
                .map((item) => ({
                  role: item.role,
                  content: item.content,
                }));

              const lastMessage = messages[messages.length - 1];
              const abortController = new AbortController();
              const response = await fetch('/api/chat', {
                signal: abortController.signal,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept-Encoding': '*',
                },
                body: JSON.stringify(
                  meta?.need_reset
                    ? {
                        messages: [],
                        new_input: lastMessage.content,
                        departure: null,
                        distance: null,
                        score: null,
                        season: null,
                      }
                    : {
                        messages:
                          messages.length >= 1 ? messages.slice(0, messages.length - 1) : [],
                        new_input: lastMessage.content,
                        departure: meta?.departure || null,
                        distance: meta?.distance || null,
                        season: meta?.season || null,
                        score: meta?.score || null,
                      },
                ),
              });
              if (!response.ok || !response.body) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder('utf-8');
              const encoder = new TextEncoder();

              const readableStream = new ReadableStream({
                async start(controller) {
                  // add buffer to assure that chunk is complete
                  // ref: https://github.com/ant-design/pro-chat/issues/187#issuecomment-2205161783
                  let buffer = '';
                  function push() {
                    reader
                      .read()
                      .then(({ done, value }) => {
                        if (done) {
                          controller.close();
                          setLoading(false);
                          return;
                        }
                        buffer += decoder.decode(value, { stream: true });
                        let boundary = buffer.indexOf('\n');
                        while (boundary !== -1) {
                          const chunk = buffer.slice(0, boundary).trim();
                          // update buffer
                          buffer = buffer.slice(boundary + 1);
                          if (chunk?.startsWith('meta:')) {
                            const message = chunk.replace('meta:', '');
                            const meta = jsonParse(message, {}) as Meta;
                            setMeta(meta);
                            const chatMessages = proChat.getChatMessages();
                            const asistantMessage = chatMessages[chatMessages.length - 1];
                            // @ts-ignore
                            proChat.setChat(asistantMessage.id, {
                              ...asistantMessage,
                              sql: meta.sql,
                              datas: meta.datas,
                            });
                            if (meta.need_reset) {
                              setResetMessageId(originMessages[originMessages.length - 1].id);
                            }
                            // close request when datas is not empty
                            if ((meta.datas?.length || 0) > 0) {
                              abortController.abort();
                              setLoading(false);
                            }
                          } else if (chunk?.startsWith('data:')) {
                            const message = chunk.replaceAll('data:', '').replaceAll('\n', '');
                            controller.enqueue(encoder.encode(message));
                          }
                          boundary = buffer.indexOf('\n');
                        }
                        push();
                      })
                      .catch((err) => {
                        console.error('Read stream error: ', err);
                        controller.error(err);
                      });
                  }
                  push();
                },
              });
              return new Response(readableStream);
            }}
          />
          <div ref={footerRef} className="footer">
            本应用生成的所有内容均由人工智能模型生成，其生成内容的准确性和完整性无法保证，不代表我们的观点，仅供您参考。您使用本应用需遵守《OceanBase官方网站服务协议》《OceanBase官方网站隐私政策》
          </div>
        </div>
      </div>
      <div className="right">
        <MapContainer positionList={positionList} />
      </div>
    </div>
  );
};

export default function () {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontSize: 15,
          // colorText: '#000000d9',
        },
      }}
    >
      <ProChatProvider>
        <Main />
      </ProChatProvider>
    </ConfigProvider>
  );
}
