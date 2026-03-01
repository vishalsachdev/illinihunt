import { supabase } from '../supabase'

export class CategoriesService {
  static async getCategories() {
    return supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
  }

  static async getCategory(id: string) {
    return supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
  }
}
