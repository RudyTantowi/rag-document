import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all files with their status
    const { data: files, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch files: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: files || [],
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: `Failed to get files: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
