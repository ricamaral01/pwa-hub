"""Create an exact 50 MiB PDF for an isolated GED parser probe."""
from pathlib import Path
import hashlib
import sys

TARGET = 50 * 1024 * 1024


def build(stream_length: int) -> bytes:
    parts = [b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    offsets = [0]

    def obj(number: int, body: bytes) -> None:
        offsets.append(sum(map(len, parts)))
        parts.append(f"{number} 0 obj\n".encode() + body + b"\nendobj\n")

    obj(1, b"<< /Type /Catalog /Pages 2 0 R /Names << /EmbeddedFiles << /Names [(payload.bin) 6 0 R] >> >> >>")
    obj(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    obj(3, b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>")
    obj(4, b"<< /Length 0 >>\nstream\n\nendstream")
    obj(5, f"<< /Type /EmbeddedFile /Length {stream_length} >>\nstream\n".encode() + b"A" * stream_length + b"\nendstream")
    obj(6, b"<< /Type /Filespec /F (payload.bin) /EF << /F 5 0 R >> >>")
    xref_at = sum(map(len, parts))
    parts.append(b"xref\n0 7\n0000000000 65535 f \n")
    parts.extend(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
    parts.append(f"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode())
    return b"".join(parts)


def main() -> None:
    out = Path(sys.argv[1])
    stream_length = TARGET - len(build(0)) - 10
    for _ in range(5):
        pdf = build(stream_length)
        if len(pdf) == TARGET:
            out.write_bytes(pdf)
            out.chmod(0o600)
            print(f"size={len(pdf)} sha256={hashlib.sha256(pdf).hexdigest()}")
            return
        stream_length += TARGET - len(pdf)
    raise RuntimeError("Unable to make exact-size PDF")


if __name__ == "__main__":
    main()
