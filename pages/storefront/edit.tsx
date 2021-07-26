import React, { useState, useContext } from 'react';
import sv from '@/constants/styles'
import styled from 'styled-components';
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { Card, Row, Col, Typography, Space, Form, Input, FormItemProps, Tabs } from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import Button from '@/components/elements/Button'
import ColorPicker from '@/components/elements/ColorPicker'
import FontSelect from '@/common/components/elements/FontSelect'
import Upload from '@/common/components/elements/Upload'
import { stylesheet } from '@/modules/theme'
// @ts-ignore
import Color from 'color'
import { AuthProvider } from '@/modules/auth'
import { initArweave } from '@/modules/arweave'
import { StorefrontContext } from '@/modules/storefront'
import { WalletContext } from '@/modules/wallet'
import arweaveSDK from '@/modules/arweave/client'
import { isNil, reduce, propEq, findIndex, update, assocPath, isEmpty, ifElse, has, prop, lensPath, view, when } from 'ramda';

const { TabPane } = Tabs

const { Text, Title, Paragraph } = Typography

const PreviewButton = styled.div<{ textColor: string }>`
  height: 52px;
  background: ${props => props.color};
  color: ${props => props.textColor};
  width: fit-content;
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  font-weight: 700;
`;

const UploadedLogo = styled.img`
  height: 48px;
  width: 48px;
`;

const PreviewLink = styled.div`
  color: ${props => props.color};
  text-decoration: underline;
`;

type PrevTitleProps = {
  color: string;
  level: number;
  fontFamily: string;

}
const PrevTitle = styled(Title)`
  &.ant-typography {
    font-family: '${({ fontFamily }: PrevTitleProps) => fontFamily}', sans;
    color: ${({ color }: PrevTitleProps) => color};
  }
`

type PrevTextProps = {
  color: string;
  fontFamily: string;
}

const PrevText = styled(Text)`
&.ant-typography {
  font-family: '${({ fontFamily }: PrevTextProps) => fontFamily}', sans;
  color: ${({ color }: PrevTextProps) => color};
}
`
type PrevCardProps = {
  bgColor: string;
}

const PrevCard = styled(Card)`
&.ant-card {
  border-radius: 12px;
  height: 100%;
  display: flex;
  align-items: center;
  background-color: ${({ bgColor }: PrevCardProps) => bgColor};
}
`

interface InlineFormItemProps extends FormItemProps {
  noBackground?: boolean;
}
const InlineFormItem = styled(Form.Item) <InlineFormItemProps>`
  &.ant-form-item {
    background: ${({ noBackground }) => noBackground ? "none" : "#e0e0e0"};
    border-radius: 12px;
    padding: 0 0 0 15px;
  }

  .ant-form-item-label {
    text-align: left;
  }

  .ant-form-item-control-input-content, .ant-form-item-explain {
    text-align: right;
  }
`
interface FieldData {
  name: string | number | (string | number)[];
  value?: any;
  touched?: boolean;
  validating?: boolean;
  errors?: string[];
}

const PrevCol = styled(Col)`
  margin: 0 0 24px 0;
`

const DomainFormItem = styled(Form.Item)`
  text-align: right;
  font-size: 24px;
  .ant-input {
    font-size: 24px;
    border-radius: 0px;
  }
  .ant-input-suffix {
    margin: 0;
    color: rgb(102, 102, 102);
  }
  .ant-form-item-explain {
    text-align: left;
  }
`;

export default function Edit() {
  const router = useRouter()
  const arweave = initArweave()
  const [tab, setTab] = useState("theme")
  const [submitting, setSubmitting] = useState(false)
  const { storefront } = useContext(StorefrontContext)
  const { wallet } = useContext(WalletContext)
  const [form] = Form.useForm()
  const { solana } = useContext(WalletContext)
  const [fields, setFields] = useState<FieldData[]>([
    { name: ['subdomain'], value: storefront?.subdomain },
    { name: ['theme', 'backgroundColor'], value: storefront?.theme.backgroundColor },
    { name: ['theme', 'primaryColor'], value: storefront?.theme.primaryColor },
    { name: ['theme', 'titleFont'], value: storefront?.theme.titleFont },
    { name: ['theme', 'textFont'], value: storefront?.theme.textFont },
    { name: ['theme', 'logo'], value: [{ ...storefront?.theme.logo, status: "done" }] },
  ]);

  if (isNil(solana) || isNil(storefront) || isNil(wallet)) {
    return
  }

  const values = reduce((acc: any, item: FieldData) => {
    return assocPath(item.name as string[], item.value, acc)
  }, {}, fields)

  const domain = `${values.subdomain}.holaplex.com`

  const subdomainUniqueness = async (_: any, subdomain: any) => {
    const search = await arweaveSDK.search(arweave).storefront("holaplex:metadata:subdomain", subdomain || "")

    if (isNil(search) || search.pubkey === wallet.pubkey) {
      return Promise.resolve(subdomain)
    }

    return Promise.reject("The subdomain is already in use. Please pick another.")
  }

  const onSubmit = async () => {
    try {
      setSubmitting(true)

      const { theme, subdomain } = values
      const { pubkey } = storefront
      // @ts-ignore
      const logo = when(has('response'), prop('response'))(theme.logo[0])

      const css = stylesheet({ ...theme, logo })

      const transaction = await arweave.createTransaction({ data: css })

      toast(() => (<>Your storefront theme is being uploaded to Arweave.</>))

      transaction.addTag("Content-Type", "text/css")
      transaction.addTag("solana:pubkey", pubkey)
      transaction.addTag("holaplex:metadata:subdomain", subdomain)
      transaction.addTag("holaplex:theme:logo:url", logo.url)
      transaction.addTag("holaplex:theme:logo:name", logo.name)
      transaction.addTag("holaplex:theme:logo:type", logo.type)
      transaction.addTag("holaplex:theme:color:primary", theme.primaryColor)
      transaction.addTag("holaplex:theme:color:background", theme.backgroundColor)
      transaction.addTag("holaplex:theme:font:title", theme.titleFont)
      transaction.addTag("holaplex:theme:font:text", theme.textFont)
      transaction.addTag("Arweave-App", "holaplex")

      await arweave.transactions.sign(transaction)

      await arweave.transactions.post(transaction)

      toast(() => (<>Your storefront was updated. Visit <a href={`https://${domain}`}>{domain}</a> to view the changes.</>), { autoClose: 60000 })

      router.push("/").then(() => { setSubmitting(false) })
    } catch {
      toast.error(() => (<>There was an issue updating your storefront. Please wait a moment and try again.</>))
    }
  }


  const textColor = new Color(values.theme.backgroundColor).isDark() ? sv.colors.buttonText : sv.colors.text
  const buttontextColor = new Color(values.theme.primaryColor).isDark() ? sv.colors.buttonText : sv.colors.text

  const tabs = {
    theme: (
      <Row justify="space-between">
        <Col sm={24} md={12} lg={12}>
          <Title level={2}>Edit your store theme.</Title>
          <InlineFormItem
            noBackground
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
            label="Logo"
            name={["theme", "logo"]}
            rules={[
              { required: true, message: "Upload a logo." }
            ]}
          >
            <Upload>
              {isEmpty(values.theme.logo) && (
                <Button block type="primary" size="middle" icon={<UploadOutlined />} >Upload</Button>
              )}
            </Upload>
          </InlineFormItem>
          <InlineFormItem
            name={["theme", "backgroundColor"]}
            label="Background"
            labelCol={{ xs: 10 }}
            wrapperCol={{ xs: 14 }}
          >
            <ColorPicker />
          </InlineFormItem>
          <InlineFormItem
            name={["theme", "primaryColor"]}
            label="Buttons &amp; Links"
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
          >
            <ColorPicker />
          </InlineFormItem>
          <InlineFormItem
            name={["theme", "titleFont"]}
            label="Title Font"
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
          >
            <FontSelect />
          </InlineFormItem>
          <InlineFormItem
            name={["theme", "textFont"]}
            label="Main Text Font"
            labelCol={{ span: 10 }}
            wrapperCol={{ span: 14 }}
          >
            <FontSelect />
          </InlineFormItem>
        </Col>
        <PrevCol sm={24} md={11} lg={10}>
          <PrevCard bgColor={values.theme.backgroundColor}>
            <Space direction="vertical">
              {values.theme.logo[0] && values.theme.logo[0].status === "done" && (
                <UploadedLogo src={ifElse(has('response'), view(lensPath(['response', 'url'])), prop('url'))(values.theme.logo[0])} />
              )}
              <PrevTitle level={2} color={textColor} fontFamily={values.theme.titleFont}>Big Title</PrevTitle>
              <PrevTitle level={3} color={textColor} fontFamily={values.theme.titleFont}>Little Title</PrevTitle>
              <PrevText color={textColor} fontFamily={values.theme.textFont}>Main text Lorem gizzle dolizzle go to hizzle amizzle, own yo adipiscing fo shizzle. Cool sapizzle velizzle, volutpat, suscipizzle quis, gravida vizzle, arcu.</PrevText>
              <PreviewLink
                color={values.theme.primaryColor}

              >
                Link to things
              </PreviewLink>
              <PreviewButton
                className="apply-font-body"
                color={values.theme.primaryColor}
                textColor={buttontextColor}
              >
                Button
              </PreviewButton>
            </Space>
          </PrevCard>
        </PrevCol>
      </Row>
    ),
    subdomain: (
      <>
        <Title level={2}>Switch your store subdomain.</Title>
        <DomainFormItem
          name="subdomain"
          rules={[
            { required: true, pattern: /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, message: "The subdomain entered is not valid." },
            { required: true, validator: subdomainUniqueness },
          ]}
        >
          <Input autoFocus suffix=".holaplex.com" />
        </DomainFormItem>
      </>
    )
  }
  return (
    <AuthProvider storefront={storefront} wallet={wallet}>
      <Row justify="center" align="middle">
        <Col
          xs={21}
          lg={18}
          xl={16}
          xxl={14}
        >
          <Card
            activeTabKey={tab}
            onTabChange={key => {
              setTab(key)
            }}
            tabList={[
              { key: "theme", tab: "Theme" },
              { key: "subdomain", tab: "Subdomain" }
            ]}
          >
            <Form
              form={form}
              size="large"
              fields={fields}
              onFieldsChange={([changed], _) => {
                if (isNil(changed)) {
                  return
                }
  
                const current = findIndex(propEq('name', changed.name), fields)
                setFields(update(current, changed, fields));
              }}
              onFinish={onSubmit}
              layout="horizontal"
              colon={false}
            >
              {/*@ts-ignore*/}
              {tabs[tab]}
              <Row justify="end">
                <Button type="primary" htmlType="submit" disabled={submitting} loading={submitting}>Update</Button>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </AuthProvider>
  )
}
