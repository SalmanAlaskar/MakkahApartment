import { createClient } from "@/lib/supabase/server";

export interface ContractWithSignatures {
  content: string;
  version: number;
  updatedAt: string;
  signatures: Array<{
    partnerId: string;
    partnerName: string;
    signToken: string;
    signedAt: string | null;
    signerName: string | null;
  }>;
}

export async function getContractWithSignatures(): Promise<ContractWithSignatures | null> {
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("partnership_contract")
    .select("content, version, updated_at")
    .eq("id", true)
    .single();
  if (!contract) return null;

  const [{ data: signatures }, { data: partners }] = await Promise.all([
    supabase
      .from("contract_signatures")
      .select("partner_id, sign_token, signed_at, signer_name")
      .eq("contract_version", contract.version),
    supabase.from("partners").select("id, name").order("display_order"),
  ]);

  const signatureByPartnerId = new Map((signatures ?? []).map((s) => [s.partner_id, s]));

  return {
    content: contract.content,
    version: contract.version,
    updatedAt: contract.updated_at,
    signatures: (partners ?? []).map((p) => {
      const s = signatureByPartnerId.get(p.id);
      return {
        partnerId: p.id,
        partnerName: p.name,
        signToken: s?.sign_token ?? "",
        signedAt: s?.signed_at ?? null,
        signerName: s?.signer_name ?? null,
      };
    }),
  };
}

export interface SigningContext {
  contractContent: string;
  contractVersion: number;
  partnerName: string;
  signedAt: string | null;
}

export async function getSigningContextByToken(token: string): Promise<SigningContext | null> {
  const supabase = await createClient();
  const { data: signature } = await supabase
    .from("contract_signatures")
    .select("partner_id, contract_version, signed_at")
    .eq("sign_token", token)
    .single();
  if (!signature) return null;

  const [{ data: contract }, { data: partner }] = await Promise.all([
    supabase.from("partnership_contract").select("content, version").eq("id", true).single(),
    supabase.from("partners").select("name").eq("id", signature.partner_id).single(),
  ]);
  if (!contract || !partner || contract.version !== signature.contract_version) return null;

  return {
    contractContent: contract.content,
    contractVersion: contract.version,
    partnerName: partner.name,
    signedAt: signature.signed_at,
  };
}
