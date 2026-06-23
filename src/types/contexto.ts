export interface CIMotivator {
  id: string;
  type: "problema" | "necesidad" | "deseo";
  text: string;
  own_words: string;
  urgency: "baja" | "media" | "alta";
}

export interface CIProfile {
  id: string;
  name: string;
  description: string;
  contexts: string[];
  motivators: CIMotivator[];
  action_trigger: string;
}

export interface ContextoIdentidad {
  what_you_do: string;
  what_you_sell: string;
  client_result: string;
  differentiator: string;
  credibility: string;
}

export interface ContextoClientes {
  profiles: CIProfile[];
}

export interface ContextoTono {
  style: string;
  tuteo: "tuteo" | "usted";
  own_words: string;
  avoid_words: string;
  ten_second_phrase: string;
}

export interface ContextoSector {
  sector: string;
  event_types: string[];
  geography: string;
}

export interface ContextoExpectativas {
  visitors: string;
  keychains: string;
  contacts_target: string;
  conversion_rate: string;
}

export interface ContextoSeguimiento {
  channels: string[];
  timing: string;
  first_contact_offer: string;
  stand_promise: string;
}
