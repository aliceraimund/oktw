'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle, MapPin, AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignatureCanvas, type SignatureCanvasHandle } from '@/components/SignatureCanvas'
import { formatDateBR, formatCA } from '@/lib/utils'
import type { FichaEntrega } from '@/types/database'

type PageState = 'loading' | 'ready' | 'already_signed' | 'not_found' | 'submitting' | 'success' | 'error'

type GeoState = {
  lat: number | null
  lng: number | null
  status: 'pending' | 'granted' | 'denied' | 'unavailable'
}

export default function AssinarPage() {
  const { token } = useParams<{ token: string }>()
  const sigRef = useRef<SignatureCanvasHandle>(null)

  const [state, setState] = useState<PageState>('loading')
  const [ficha, setFicha] = useState<FichaEntrega | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [consentimento, setConsentimento] = useState(false)
  const [consentimentoEm, setConsentimentoEm] = useState<string | null>(null)
  const [geo, setGeo] = useState<GeoState>({ lat: null, lng: null, status: 'pending' })

  useEffect(() => {
    async function loadFicha() {
      const res = await fetch(`/api/assinatura/${token}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (res.status === 409) setState('already_signed')
        else if (res.status === 404) setState('not_found')
        else { setErrorMsg(json.error || 'Erro desconhecido'); setState('error') }
        return
      }
      const json = await res.json()
      setFicha(json.ficha)
      setState('ready')
    }
    loadFicha()
  }, [token])

  function pedirLocalizacao() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ lat: null, lng: null, status: 'unavailable' })
      return
    }
    setGeo((g) => ({ ...g, status: 'pending' }))
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'granted' }),
      () => setGeo({ lat: null, lng: null, status: 'denied' }),
      { timeout: 8000 }
    )
  }

  useEffect(() => {
    pedirLocalizacao()
  }, [])

  function handleConsentimento(checked: boolean) {
    setConsentimento(checked)
    if (checked && !consentimentoEm) {
      setConsentimentoEm(new Date().toISOString())
    }
  }

  async function handleConfirmar() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert('Por favor, assine no campo acima antes de confirmar.')
      return
    }
    if (!consentimento) {
      alert('É necessário confirmar o consentimento eletrônico antes de assinar.')
      return
    }
    setState('submitting')
    const assinaturaBase64 = sigRef.current.toDataURL('image/png')
    const res = await fetch(`/api/assinatura/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assinaturaBase64,
        geolocalizacaoLat: geo.lat,
        geolocalizacaoLng: geo.lng,
        geolocalizacaoStatus: geo.status,
        consentimentoEletronico: true,
        consentimentoEm: consentimentoEm ?? new Date().toISOString(),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setErrorMsg(json.error || 'Erro ao salvar assinatura.')
      setState('error')
      return
    }
    setPdfUrl(json.pdfUrl)
    setState('success')
  }

  if (state === 'loading') {
    return (
      <LayoutCentrado>
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="text-muted-foreground mt-4">Carregando...</p>
      </LayoutCentrado>
    )
  }

  if (state === 'not_found') {
    return (
      <LayoutCentrado>
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold mt-3">Link inválido</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
          Este link de assinatura não existe ou expirou. Entre em contato com o RH.
        </p>
      </LayoutCentrado>
    )
  }

  if (state === 'already_signed') {
    return (
      <LayoutCentrado>
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold mt-3">Já assinado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
          Esta ficha já foi assinada anteriormente. Não é necessária nova assinatura.
        </p>
      </LayoutCentrado>
    )
  }

  if (state === 'success') {
    return (
      <LayoutCentrado>
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <h2 className="text-xl font-bold mt-4">Recebimento confirmado!</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
          Sua assinatura foi registrada com sucesso.
        </p>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-6">
            <Button variant="outline">Baixar ficha (PDF)</Button>
          </a>
        )}
      </LayoutCentrado>
    )
  }

  if (state === 'error') {
    return (
      <LayoutCentrado>
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold mt-3">Erro</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">{errorMsg}</p>
        <Button className="mt-6" onClick={() => setState('ready')}>Tentar novamente</Button>
      </LayoutCentrado>
    )
  }

  const colaborador = ficha?.colaborador
  const ehDevolucao = ficha?.tipo === 'retirada'

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-2">
          <Logo className="h-12 w-auto" />
          <p className="text-slate-500 text-xs">{ehDevolucao ? 'Confirmação de devolução de EPIs' : 'Confirmação de recebimento de EPIs'}</p>
        </div>

        {/* Colaborador */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-semibold">{colaborador?.nome}</p>
            <p className="text-sm text-muted-foreground">
              {colaborador?.cargo}{colaborador?.setor ? ` · ${colaborador.setor}` : ''}
            </p>
          </CardContent>
        </Card>

        {/* EPIs entregues */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {ehDevolucao ? 'EPIs devolvidos em' : 'EPIs recebidos em'} {formatDateBR(ficha?.data_entrega ?? '')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {ficha?.itens?.map((item, i) => (
              <div key={item.id} className={i > 0 ? 'pt-3 border-t' : ''}>
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{item.epi?.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatCA(item.epi?.ca)} · Qtd: {item.quantidade}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Vence em</p>
                    <p className="font-medium text-slate-700">{formatDateBR(item.data_vencimento)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Termo (entrega) ou Declaração (devolução) */}
        {ehDevolucao ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Declaração de devolução
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-600">
              Declaro que estou devolvendo à empresa OKTW COMERCIO E SERVICOS LTDA (CNPJ 51.747.453/0001-17)
              os Equipamentos de Proteção Individual listados acima, e consinto com a assinatura eletrônica
              desta confirmação, nos termos da Lei nº 14.063/2020 e conforme a NR-6 item 6.5.1.
            </p>
          </CardContent>
        </Card>
        ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Termo de Responsabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-600 space-y-3 max-h-48 overflow-y-auto pr-1">
              <p className="font-semibold text-slate-800">
                TERMO DE RESPONSABILIDADE PELA GUARDA E USO DO EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL – EPI
              </p>
              <p>
                Recebi da empresa OKTW COMERCIO E SERVICOS LTDA, CNPJ: 51.747.453/0001-17, a título de empréstimo,
                para meu uso exclusivo e obrigatório nas dependências da empresa, conforme determinado na NR-6 item 6.5.1,
                os equipamentos discriminados a seguir, comprometendo-me a mantê-los em perfeito estado de uso e
                conservação, ficando ciente de que:
              </p>
              <p>1- Recebi treinamento quanto à necessidade na utilização dos referidos EPI's, a maneira correta de usá-los, guardá-los e higienizá-los, bem como da minha responsabilidade quanto a seu uso, conforme determinado na NR-6 item 6.5.1;</p>
              <p>2- Se o equipamento foi danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá novo equipamento e cobrará o valor de um equipamento da mesma marca ou equivalente (Art. 462 em seu parágrafo 1º da C.L.T.);</p>
              <p>3- Fico proibido de dar ou emprestar o equipamento que estiver sob a minha responsabilidade, só podendo fazê-lo se receber ordem por escrito de pessoas autorizadas para tal fim;</p>
              <p>4- Em caso de dano, inutilização ou extravio do equipamento, deverei comunicar imediatamente ao setor competente;</p>
              <p>5- Terminados os serviços, ou no caso de rescisão do contrato de trabalho, devolverei o equipamento completo e em perfeito estado de conservação, considerando-se o tempo de uso do mesmo, ao setor competente;</p>
              <p>6- Estando os equipamentos em minha posse, estarei sujeito a inspeções sem prévio aviso.</p>
              <p>7- Fico ciente de que pela não utilização do equipamento de proteção individual em serviço, estarei sujeito às sanções disciplinares cabíveis, que irão desde a simples advertência até a dispensa por justa causa, nos termos do Art. 482 letra "h" da C.L.T., conforme NR-6 item 6.5.1.</p>
              <p>8- Declaro expressamente que consinto com a assinatura eletrônica do presente termo, nos termos da Lei nº 14.063/2020 e conforme NR-6 item 6.5.1, tendo plena ciência de que esta assinatura possui validade legal equivalente à assinatura manuscrita.</p>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Status da localização — reforça a validade jurídica da assinatura */}
        {geo.status === 'granted' ? (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0" />
            Localização registrada — sua assinatura terá validade reforçada.
          </div>
        ) : geo.status === 'pending' ? (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border rounded-lg px-3 py-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Obtendo sua localização...
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {geo.status === 'denied'
                  ? 'Localização bloqueada.'
                  : 'Localização indisponível neste dispositivo.'}
              </p>
              <p>
                Recomendamos fortemente permitir o acesso à localização, pois ela reforça a validade
                jurídica da assinatura.{' '}
                {geo.status === 'denied' && (
                  <button type="button" onClick={pedirLocalizacao} className="underline font-medium">
                    Tentar novamente
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Consentimento eletrônico — obrigatório */}
        <div className={`p-4 rounded-lg border-2 transition-colors ${consentimento ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 rounded accent-slate-900"
              checked={consentimento}
              onChange={(e) => handleConsentimento(e.target.checked)}
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Li e compreendi {ehDevolucao ? 'a Declaração de devolução' : 'o Termo de Responsabilidade'} acima, e{' '}
              <strong>consinto expressamente</strong> com a utilização de assinatura eletrônica, com força probatória
              nos termos da <strong>Lei nº 14.063/2020</strong> e conforme <strong>NR-6 item 6.5.1</strong>.
            </span>
          </label>
        </div>

        {/* Assinatura */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Assinatura eletrônica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              {ehDevolucao
                ? 'Ao assinar abaixo, declaro que devolvi à empresa todos os EPIs listados acima.'
                : 'Ao assinar abaixo, declaro que li e concordo com o Termo de Responsabilidade acima e que recebi todos os EPIs listados em perfeito estado.'}
            </p>
            <SignatureCanvas ref={sigRef} />
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 text-base"
          onClick={handleConfirmar}
          disabled={state === 'submitting' || !consentimento}
        >
          {state === 'submitting' ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando assinatura...</>
          ) : (
            ehDevolucao ? 'Confirmar devolução e assinar' : 'Confirmar recebimento e assinar'
          )}
        </Button>

        {!consentimento && (
          <p className="text-xs text-center text-amber-600">
            Marque o consentimento acima para habilitar a assinatura.
          </p>
        )}

        <p className="text-xs text-center text-muted-foreground pb-6">
          Este documento tem valor probatório conforme a NR-6 item 6.5.1 e Lei nº 14.063/2020.
        </p>
      </div>
    </div>
  )
}

function LayoutCentrado({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Logo className="h-16 w-auto mb-6" />
      {children}
    </div>
  )
}
