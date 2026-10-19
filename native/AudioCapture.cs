// Original UMBRA process-loopback bridge. MIT license, see ../LICENSE.
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

[ComImport, Guid("1CB9AD4C-DBFA-4C32-B178-C2F568A703B2"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioClient {
 [PreserveSig] int Initialize(int mode, uint flags, long duration, long periodicity, ref WaveFormat format, IntPtr session);
 [PreserveSig] int GetBufferSize(out uint frames);
 [PreserveSig] int GetStreamLatency(out long latency);
 [PreserveSig] int GetCurrentPadding(out uint padding);
 [PreserveSig] int IsFormatSupported(int mode, ref WaveFormat format, out IntPtr closest);
 [PreserveSig] int GetMixFormat(out IntPtr format);
 [PreserveSig] int GetDevicePeriod(out long normal, out long minimum);
 [PreserveSig] int Start();
 [PreserveSig] int Stop();
 [PreserveSig] int Reset();
 [PreserveSig] int SetEventHandle(IntPtr handle);
 [PreserveSig] int GetService(ref Guid iid, [MarshalAs(UnmanagedType.IUnknown)] out object service);
}
[ComImport, Guid("C8ADBD64-E71E-48A0-A4DE-185C395CD317"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioCaptureClient {
 [PreserveSig] int GetBuffer(out IntPtr data, out uint frames, out uint flags, out ulong position, out ulong counter);
 [PreserveSig] int ReleaseBuffer(uint frames);
 [PreserveSig] int GetNextPacketSize(out uint frames);
}
[ComImport, Guid("72A22D78-CDE4-431D-B8CC-843A71199B6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IActivateAudioInterfaceAsyncOperation {
 [PreserveSig] int GetActivateResult(out int result, [MarshalAs(UnmanagedType.IUnknown)] out object client);
}
[ComVisible(true), Guid("41D949AB-9862-444A-80F6-C261334DA5EB"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IActivateAudioInterfaceCompletionHandler {
 [PreserveSig] int ActivateCompleted(IActivateAudioInterfaceAsyncOperation operation);
}
[ComVisible(true), Guid("94EA2B94-E9CC-49E0-C0FF-EE64CA8F5B90"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAgileObject {}
[StructLayout(LayoutKind.Sequential, Pack=2)]
public struct WaveFormat {public ushort tag, channels; public uint rate, byteRate; public ushort align, bits, extra;}
[StructLayout(LayoutKind.Explicit, Size=24)]
public struct PropVariant {
 [FieldOffset(0)] public ushort type;
 [FieldOffset(8)] public uint size;
 [FieldOffset(16)] public IntPtr data;
}
[ComVisible(true), ClassInterface(ClassInterfaceType.None)]
public sealed class Completion : IActivateAudioInterfaceCompletionHandler, IAgileObject {
 public readonly ManualResetEvent Done=new ManualResetEvent(false);
 public int Result=unchecked((int)0x80004005);
 public object Client;
 public int ActivateCompleted(IActivateAudioInterfaceAsyncOperation operation) {
  try{int result;object client;int hr=operation.GetActivateResult(out result,out client);Result=hr<0?hr:result;Client=client;}catch(Exception e){Result=Marshal.GetHRForException(e);}finally{Done.Set();}return 0;
 }
}
public static class AudioCapture {
 [DllImport("Mmdevapi.dll", ExactSpelling=true, CharSet=CharSet.Unicode)]
 static extern int ActivateAudioInterfaceAsync(string device, ref Guid iid, ref PropVariant args, IActivateAudioInterfaceCompletionHandler callback, out IActivateAudioInterfaceAsyncOperation operation);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint process);
 [DllImport("user32.dll")] static extern bool IsWindow(IntPtr window);
 static volatile bool stopping;
 static void Check(int hr){if(hr<0)Marshal.ThrowExceptionForHR(hr);}
 [MTAThread] public static int Main(string[] args) {
  IAudioClient client=null;IAudioCaptureClient capture=null;IActivateAudioInterfaceAsyncOperation operation=null;IntPtr parameters=IntPtr.Zero;
  try {
   long handle;if(args.Length!=1||!long.TryParse(args[0],out handle)||handle<=0)throw new ArgumentException("Invalid window");
   IntPtr window=new IntPtr(handle);uint process;if(!IsWindow(window)||GetWindowThreadProcessId(window,out process)==0||process==0)throw new ArgumentException("Window closed");
   parameters=Marshal.AllocHGlobal(12);Marshal.WriteInt32(parameters,0,1);Marshal.WriteInt32(parameters,4,unchecked((int)process));Marshal.WriteInt32(parameters,8,0); // INCLUDE_TARGET_PROCESS_TREE
   PropVariant variant=new PropVariant{type=65,size=12,data=parameters};Guid iid=typeof(IAudioClient).GUID;Completion completion=new Completion();
   Check(ActivateAudioInterfaceAsync("VAD\\Process_Loopback",ref iid,ref variant,completion,out operation));
   if(!completion.Done.WaitOne(8000))throw new TimeoutException("Audio activation timeout");Check(completion.Result);client=(IAudioClient)completion.Client;
   WaveFormat format=new WaveFormat{tag=1,channels=2,rate=48000,byteRate=192000,align=4,bits=16,extra=0};
   Check(client.Initialize(0,0x80060000,5000000,0,ref format,IntPtr.Zero));
   using(AutoResetEvent ready=new AutoResetEvent(false)) {
    Check(client.SetEventHandle(ready.SafeWaitHandle.DangerousGetHandle()));Guid captureId=typeof(IAudioCaptureClient).GUID;object service;Check(client.GetService(ref captureId,out service));capture=(IAudioCaptureClient)service;
    Check(client.Start());Stream output=Console.OpenStandardOutput();byte[] header=new byte[]{85,77,66,82,65,80,67,77,128,187,0,0,2,0,16,0};output.Write(header,0,header.Length);output.Flush();
    Thread input=new Thread(delegate(){try{Console.OpenStandardInput().ReadByte();}catch{}stopping=true;});input.IsBackground=true;input.Start();
    while(!stopping) {
     uint current;if(!IsWindow(window)||GetWindowThreadProcessId(window,out current)==0||current!=process)break;
     ready.WaitOne(100);uint frames;Check(capture.GetNextPacketSize(out frames));
     while(frames>0&&!stopping) {
      IntPtr data;uint count,flags;ulong position,counter;Check(capture.GetBuffer(out data,out count,out flags,out position,out counter));
      try{if(count>48000)throw new InvalidDataException("Audio packet too large");byte[] bytes=new byte[checked((int)count*4)];if((flags&2)==0&&data!=IntPtr.Zero)Marshal.Copy(data,bytes,0,bytes.Length);output.Write(bytes,0,bytes.Length);output.Flush();}finally{Check(capture.ReleaseBuffer(count));}
      Check(capture.GetNextPacketSize(out frames));
     }
    }
   }
   return 0;
  }catch(Exception e){Console.Error.WriteLine("Application audio unavailable (0x"+Marshal.GetHRForException(e).ToString("X8")+"): "+e.Message);return 1;}
  finally{if(client!=null)try{client.Stop();}catch{}if(capture!=null)Marshal.ReleaseComObject(capture);if(client!=null)Marshal.ReleaseComObject(client);if(operation!=null)Marshal.ReleaseComObject(operation);if(parameters!=IntPtr.Zero)Marshal.FreeHGlobal(parameters);}
 }
}
