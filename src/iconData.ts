export interface IconData {
  filename: string;
  description: string;
  title: string;
  tag1?: string;
  tag2?: string;
  tag3?: string;
}

export async function fetchIconData(): Promise<IconData[]> {
  try {
    const response = await fetch('/thiings/somethi.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: IconData[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch icon data:", error);
    return []; // Return an empty array on error
  }
}
