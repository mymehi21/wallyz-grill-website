export interface CloverConfig {
  merchantId: string;
  accessToken: string;
  apiUrl: string;
}

export interface CloverOrder {
  id?: string;
  currency: string;
  total: number;
  title: string;
  note?: string;
  state?: string;
  customers?: {
    id: string;
  }[];
  lineItems?: CloverLineItem[];
}

export interface CloverLineItem {
  name: string;
  price: number;
  unitQty?: number;
  note?: string;
}

export class CloverService {
  private config: CloverConfig;

  constructor(config: CloverConfig) {
    this.config = config;
  }

  async createOrder(order: CloverOrder): Promise<any> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/v3/merchants/${this.config.merchantId}/orders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        }
      );

      if (!response.ok) {
        throw new Error(`Clover API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Clover order:', error);
      throw error;
    }
  }

  async addLineItemsToOrder(orderId: string, lineItems: CloverLineItem[]): Promise<any> {
    try {
      const promises = lineItems.map(item =>
        fetch(
          `${this.config.apiUrl}/v3/merchants/${this.config.merchantId}/orders/${orderId}/line_items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          }
        )
      );

      const responses = await Promise.all(promises);
      return await Promise.all(responses.map(r => r.json()));
    } catch (error) {
      console.error('Error adding line items to Clover order:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}/v3/merchants/${this.config.merchantId}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Clover API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Clover order:', error);
      throw error;
    }
  }
}
