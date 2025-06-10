export interface Tool {
  title: string;
  description: string;
  href: string;
}

export const tools: Tool[] = [
  {
    title: 'Strategy Comparison',
    description: 'Compare different investment strategies and their potential outcomes over time.',
    href: '/tools/strategy-comparison'
  },
  {
    title: 'Buy, Borrow, Die',
    description: 'Analyze the tax-efficient strategy of borrowing against appreciating assets.',
    href: '/tools/buy-borrow-die'
  },
  {
    title: 'Income from Assets',
    description: 'Calculate potential income streams from various asset classes and investments.',
    href: '/tools/income-from-assets'
  },
  {
    title: 'Selling Assets',
    description: 'Plan and optimize the sale of assets with tax implications in mind.',
    href: '/tools/selling-assets'
  },
  {
    title: 'Retirement Calculator',
    description: 'Project your retirement needs and analyze different savings strategies.',
    href: '/tools/retirement-calculator'
  }
]; 