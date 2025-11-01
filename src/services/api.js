import { supabase } from './supabase'

export const authAPI = {
  // Register new user
  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Login user
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // Logout user
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

export const scopesAPI = {
  // Get all user's scopes
  async getAll() {
    const { data, error } = await supabase
      .from('scopes')
      .select('*')
      .order('position', { ascending: true })

    if (error) throw error
    return data
  },

  // Create new scope
  async create(name, position) {
    const user = await authAPI.getCurrentUser()
    const { data, error } = await supabase
      .from('scopes')
      .insert([{ name, position, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update scope name
  async update(id, name) {
    const { data, error } = await supabase
      .from('scopes')
      .update({ name })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete scope
  async delete(id) {
    const { error } = await supabase
      .from('scopes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const todosAPI = {
  // Get todos by scope
  async getByScopeId(scopeId) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('scope_id', scopeId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  },

  // Create new todo
  async create(scopeId, text, position) {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ scope_id: scopeId, text, position }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Toggle todo completion
  async toggle(id, completed) {
    const { data, error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update todo text
  async update(id, text) {
    const { data, error } = await supabase
      .from('todos')
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete todo
  async delete(id) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const settingsAPI = {
  // Get user settings
  async get() {
    const user = await authAPI.getCurrentUser()
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // Update user settings
  async update(settings) {
    const user = await authAPI.getCurrentUser()
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
