// Database API for handling user data
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to format responses
const formatResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

// Handle OPTIONS requests (CORS preflight)
const handleOptions = () => {
  return formatResponse(200, {});
};

// Handle GET requests - fetch data
const handleGet = async (event) => {
  try {
    const path = event.path.split('/');
    const collection = path[path.length - 2]; // The collection name
    const key = path[path.length - 1]; // The document key/id
    
    if (!collection || collection === 'api') {
      return formatResponse(400, { error: 'Collection is required' });
    }
    
    if (!key || key === 'api') {
      // List all documents in collection
      const { data, error } = await supabase
        .from(collection)
        .select('*');
        
      if (error) throw error;
      return formatResponse(200, data);
    } else {
      // Get specific document
      const { data, error } = await supabase
        .from(collection)
        .select('*')
        .eq('key', key)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          return formatResponse(404, { error: 'Not found' });
        }
        throw error;
      }
      
      return formatResponse(200, data.value);
    }
  } catch (error) {
    console.error('GET Error:', error);
    return formatResponse(500, { error: error.message });
  }
};

// Handle POST requests - save data
const handlePost = async (event) => {
  try {
    const path = event.path.split('/');
    const collection = path[path.length - 2];
    const key = path[path.length - 1];
    
    if (!collection || collection === 'api') {
      return formatResponse(400, { error: 'Collection is required' });
    }
    
    if (!key || key === 'api') {
      return formatResponse(400, { error: 'Document key is required' });
    }
    
    let value;
    try {
      value = JSON.parse(event.body);
    } catch (e) {
      return formatResponse(400, { error: 'Invalid JSON body' });
    }
    
    // Upsert (update or insert) document
    const { data, error } = await supabase
      .from(collection)
      .upsert({ key, value })
      .select();
      
    if (error) throw error;
    
    return formatResponse(200, { success: true });
  } catch (error) {
    console.error('POST Error:', error);
    return formatResponse(500, { error: error.message });
  }
};

// Handle DELETE requests - delete data
const handleDelete = async (event) => {
  try {
    const path = event.path.split('/');
    const collection = path[path.length - 2];
    const key = path[path.length - 1];
    
    if (!collection || collection === 'api') {
      return formatResponse(400, { error: 'Collection is required' });
    }
    
    if (!key || key === 'api') {
      return formatResponse(400, { error: 'Document key is required' });
    }
    
    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('key', key);
      
    if (error) throw error;
    
    return formatResponse(200, { success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return formatResponse(500, { error: error.message });
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  // Route based on HTTP method
  switch (event.httpMethod) {
    case 'GET':
      return handleGet(event);
    case 'POST':
      return handlePost(event);
    case 'DELETE':
      return handleDelete(event);
    default:
      return formatResponse(405, { error: 'Method not allowed' });
  }
};